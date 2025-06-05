import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto'; // Import crypto for signature verification

// Initialize Supabase client with service role key for webhook operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const supabase = createClient(supabaseUrl, supabaseKey);

// Verification token that matches what's set in Facebook App dashboard
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token";
// Facebook App Secret for signature verification
const FB_APP_SECRET = process.env.FB_APP_SECRET;
// Central WABA ID for validation
const CENTRAL_WABA_ID = process.env.WHATSAPP_WABA_ID;

// Interface for processed message data
interface CentralizedMessageData {
  phoneNumberId: string;
  senderPhone: string;
  messageId: string;
  messageType: string;
  messageContent: string;
  timestamp: string;
  contactName?: string;
  mediaUrl?: string;
}

// Handle GET requests for webhook verification
export async function GET(request: Request) {
  const url = new URL(request.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  console.log('[WhatsApp Webhook] Verification request:', { mode, token: token ? '***' : 'missing' });

  // Check if this is a verification request
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful!');
    return new Response(challenge, { status: 200 });
  } else {
    console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
    return new Response("Verification failed", { status: 403 });
  }
}

// Handle POST requests for incoming messages
export async function POST(request: Request) {
  console.log('[WhatsApp Webhook] Incoming webhook request');

  // Read the raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';

  // Verify the signature
  if (!FB_APP_SECRET) {
    console.error('[WhatsApp Webhook] FB_APP_SECRET is not configured. Cannot verify webhook signature.');
    return new Response('Webhook security not configured', { status: 500 });
  }
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', FB_APP_SECRET)
    .update(rawBody)
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.warn('[WhatsApp Webhook] Signature verification failed!');
    console.warn('Expected:', expectedSignature);
    console.warn('Received:', signature);
    return new Response('Invalid signature', { status: 403 });
  }

  console.log('[WhatsApp Webhook] Signature verified successfully');

  // Signature verified, now parse the body
  try {
    const body = JSON.parse(rawBody);

    // Log the incoming webhook for debugging (without sensitive data)
    console.log('[WhatsApp Webhook] Received event:', {
      object: body.object,
      entryCount: body.entry?.length || 0
    });

    // Check if this is a WhatsApp message
    if (body.object === "whatsapp_business_account") {
      // Process the entries
      for (const entry of body.entry) {
        const wabaId = entry.id;
        
        // Validate this is our central WABA
        if (CENTRAL_WABA_ID && wabaId !== CENTRAL_WABA_ID) {
          console.warn(`[WhatsApp Webhook] Received webhook for unexpected WABA ID: ${wabaId}`);
          continue;
        }

        console.log(`[WhatsApp Webhook] Processing entry for WABA: ${wabaId}`);

        // Process changes
        for (const change of entry.changes) {
          if (change.field === "messages") {
            const value = change.value;

            // Handle incoming messages
            if (value.messages && value.messages.length > 0) {
              console.log(`[WhatsApp Webhook] Processing ${value.messages.length} incoming message(s)`);
              
              for (const message of value.messages) {
                // Extract message data
                const messageData: CentralizedMessageData = {
                  phoneNumberId: value.metadata.phone_number_id,
                  senderPhone: message.from,
                  messageId: message.id,
                  messageType: message.type,
                  messageContent: extractMessageContent(message),
                  timestamp: new Date(Number(message.timestamp) * 1000).toISOString(),
                  contactName: value.contacts?.[0]?.profile?.name,
                  mediaUrl: message.image?.url || message.document?.url || message.audio?.url
                };

                console.log(`[WhatsApp Webhook] Processing message from ${messageData.senderPhone}`);

                // Route and store the message
                await routeAndStoreIncomingMessage(messageData);
              }
            }

            // Handle message status updates
            if (value.statuses && value.statuses.length > 0) {
              console.log(`[WhatsApp Webhook] Processing ${value.statuses.length} status update(s)`);
              
              for (const status of value.statuses) {
                await updateCentralizedMessageStatus(status.id, status.status, status.timestamp);
              }
            }
          }
        }
      }

      // Return a 200 OK response to acknowledge receipt of the webhook
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // Not a WhatsApp webhook we're interested in
    console.log(`[WhatsApp Webhook] Ignoring non-WhatsApp webhook: ${body.object}`);
    return new Response("NOT_SUPPORTED", { status: 404 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing webhook:', error);
    return new Response("ERROR", { status: 500 });
  }
}

// Extract message content based on message type
function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text.body;
    case 'image':
      return message.image.id;
    case 'audio':
      return message.audio.id;
    case 'video':
      return message.video.id;
    case 'document':
      return message.document.id;
    case 'location':
      return `${message.location.latitude},${message.location.longitude}`;
    case 'reaction':
      return message.reaction.emoji;
    default:
      console.warn(`[WhatsApp Webhook] Unknown message type: ${message.type}`);
      return `[${message.type.toUpperCase()}]`;
  }
}

// Route incoming message to the correct landlord and store
async function routeAndStoreIncomingMessage(messageData: CentralizedMessageData) {
  try {
    console.log(`[WhatsApp Routing] Looking up landlord for phone: ${messageData.senderPhone}`);

    // Find the landlord for this tenant phone number
    const { data: routing, error: routingError } = await supabase
      .rpc('get_landlord_by_tenant_phone', { phone_number: messageData.senderPhone });

    if (routingError) {
      console.error('[WhatsApp Routing] Error looking up tenant routing:', routingError);
      // Still store the message as unrouted for debugging
      await storeUnroutedMessage(messageData, 'routing_lookup_failed');
      return;
    }

    if (!routing || routing.length === 0) {
      console.warn(`[WhatsApp Routing] No landlord found for phone: ${messageData.senderPhone}`);
      // Store as unrouted message for manual review
      await storeUnroutedMessage(messageData, 'no_landlord_found');
      return;
    }

    const landlordInfo = routing[0];
    console.log(`[WhatsApp Routing] Routing message to landlord: ${landlordInfo.landlord_name} (${landlordInfo.landlord_id})`);

    // Check if landlord has WhatsApp enabled
    if (!landlordInfo.whatsapp_enabled) {
      console.warn(`[WhatsApp Routing] Landlord ${landlordInfo.landlord_id} has WhatsApp disabled`);
      await storeUnroutedMessage(messageData, 'landlord_whatsapp_disabled');
      return;
    }

    // Store the message in the centralized table
    const { error: storeError } = await supabase
      .from('whatsapp_messages_centralized')
      .insert({
        whatsapp_message_id: messageData.messageId,
        direction: 'incoming',
        from_phone: messageData.senderPhone,
        to_phone: null, // Central number receives the message
        message_type: messageData.messageType,
        message_body: messageData.messageContent,
        media_url: messageData.mediaUrl,
        landlord_id: landlordInfo.landlord_id,
        tenant_phone: messageData.senderPhone,
        tenant_name: landlordInfo.tenant_name,
        contact_name: messageData.contactName,
        property_id: landlordInfo.property_id,
        property_address: landlordInfo.property_address,
        status: 'received',
        timestamp: messageData.timestamp
      });

    if (storeError) {
      console.error('[WhatsApp Routing] Error storing message:', storeError);
    } else {
      console.log(`[WhatsApp Routing] Message stored successfully: ${messageData.messageId}`);
      
      // TODO: Send real-time notification to landlord (WebSocket, push notification, etc.)
      // This could be implemented later to notify landlords of new messages
      console.log(`[WhatsApp Routing] TODO: Notify landlord ${landlordInfo.landlord_id} of new message`);
    }

  } catch (error) {
    console.error('[WhatsApp Routing] Exception in routeAndStoreIncomingMessage:', error);
  }
}

// Store messages that couldn't be routed to a landlord
async function storeUnroutedMessage(messageData: CentralizedMessageData, reason: string) {
  try {
    console.log(`[WhatsApp Routing] Storing unrouted message: ${reason}`);

    const { error } = await supabase
      .from('whatsapp_messages_centralized')
      .insert({
        whatsapp_message_id: messageData.messageId,
        direction: 'incoming',
        from_phone: messageData.senderPhone,
        to_phone: null,
        message_type: messageData.messageType,
        message_body: messageData.messageContent,
        media_url: messageData.mediaUrl,
        landlord_id: null, // No landlord identified
        tenant_phone: messageData.senderPhone,
        tenant_name: null,
        contact_name: messageData.contactName,
        property_id: null,
        property_address: null,
        status: 'unrouted',
        routing_failure_reason: reason,
        timestamp: messageData.timestamp
      });

    if (error) {
      console.error('[WhatsApp Routing] Error storing unrouted message:', error);
    } else {
      console.log(`[WhatsApp Routing] Unrouted message stored for manual review`);
    }
  } catch (error) {
    console.error('[WhatsApp Routing] Exception storing unrouted message:', error);
  }
}

// Update message status for centralized messages
async function updateCentralizedMessageStatus(messageId: string, status: string, timestamp?: string) {
  try {
    console.log(`[WhatsApp Status] Updating message ${messageId} to status: ${status}`);

    const updateData: any = { status };
    
    // Add timestamp-specific fields
    if (timestamp) {
      const statusTimestamp = new Date(Number(timestamp) * 1000).toISOString();
      
      if (status === 'delivered') {
        updateData.delivered_at = statusTimestamp;
      } else if (status === 'read') {
        updateData.read_at = statusTimestamp;
      }
    }

    const { error } = await supabase
      .from('whatsapp_messages_centralized')
      .update(updateData)
      .eq('whatsapp_message_id', messageId);

    if (error) {
      console.error('[WhatsApp Status] Error updating message status:', error);
    } else {
      console.log(`[WhatsApp Status] Message status updated successfully`);
    }
  } catch (error) {
    console.error('[WhatsApp Status] Exception in updateCentralizedMessageStatus:', error);
  }
}

/**
 * Process incoming WhatsApp message for centralized routing
 */
async function processIncomingMessage(messageData: any, metadata: any) {
  const from = messageData.from;
  const messageId = messageData.id;
  const timestamp = messageData.timestamp;
  const messageType = messageData.type || 'text';
  const messageBody = messageData.text?.body || messageData.caption || '';
  
  console.log(`[Webhook] Processing incoming message ${messageId} from ${from}`);
  
  // Normalize phone number for routing lookup
  const normalizedPhone = normalizePhoneNumber(from);
  
  // Look up landlord by tenant phone number
  const { data: routingData, error: routingError } = await supabase
    .rpc('get_landlord_by_tenant_phone', { phone_number: normalizedPhone });
  
  let landlordId = null;
  let routingFailureReason = null;
  let tenantName = null;
  let propertyId = null;
  let propertyAddress = null;
  
  if (routingError || !routingData || routingData.length === 0) {
    console.error(`[Webhook] No landlord found for phone ${normalizedPhone}:`, routingError);
    routingFailureReason = `No landlord found for phone ${normalizedPhone}`;
  } else {
    const route = routingData[0];
    landlordId = route.landlord_id;
    tenantName = route.tenant_name;
    propertyId = route.property_id;
    propertyAddress = route.property_address;
    
    console.log(`[Webhook] Routed message to landlord ${landlordId} for tenant ${tenantName}`);
  }
  
  // Get contact info from WhatsApp metadata
  const contactName = messageData.profile?.name || messageData.contacts?.[0]?.profile?.name;
  
  // Store message in centralized table
  const { data: storedMessage, error: storeError } = await supabase
    .from('whatsapp_messages_centralized')
    .insert({
      whatsapp_message_id: messageId,
      direction: 'incoming',
      from_phone: from,
      to_phone: null, // Central number receives the message
      message_type: messageType,
      message_body: messageBody,
      media_url: messageData.image?.url || messageData.document?.url || messageData.audio?.url,
      landlord_id: landlordId,
      tenant_phone: from,
      tenant_name: tenantName,
      contact_name: contactName,
      property_id: propertyId,
      property_address: propertyAddress,
      status: routingFailureReason ? 'unrouted' : 'received',
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
    })
    .select()
    .single();
    
  if (storeError) {
    console.error('[Webhook] Error storing message:', storeError);
    throw storeError;
  }
  
  console.log(`[Webhook] Message stored with ID: ${storedMessage?.whatsapp_message_id}`);
  
  // If routing failed, log for admin attention but don't fail the webhook
  if (routingFailureReason) {
    console.warn(`[Webhook] ADMIN ATTENTION: Unrouted message from ${from}: ${messageBody}`);
    // In production, you might want to:
    // - Send alert to admin dashboard
    // - Queue for manual review
    // - Send auto-reply explaining the issue
  }
  
  return {
    success: true,
    messageId: storedMessage?.whatsapp_message_id,
    routed: landlordId !== null,
    landlordId,
    routingFailureReason
  };
}

/**
 * Process status updates (delivered, read, etc.)
 */
async function processStatusUpdate(statusData: any) {
  const messageId = statusData.id;
  const status = statusData.status; // 'sent', 'delivered', 'read', 'failed'
  const timestamp = statusData.timestamp;
  
  console.log(`[Webhook] Processing status update for message ${messageId}: ${status}`);
  
  const updateData: any = { status };
  
  // Add specific timestamp fields
  if (status === 'delivered') {
    updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
  } else if (status === 'read') {
    updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();
  }
  
  const { error } = await supabase
    .from('whatsapp_messages_centralized')
    .update(updateData)
    .eq('whatsapp_message_id', messageId);
    
  if (error) {
    console.error('[Webhook] Error updating message status:', error);
    throw error;
  }
  
  console.log(`[Webhook] Updated message ${messageId} status to ${status}`);
  return { success: true };
}

/**
 * Normalize phone number for consistent routing
 * Handles UK numbers (+44 7xxx vs 07xxx) and removes formatting
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Handle UK numbers: convert 447xxx to 07xxx format for consistency
  if (normalized.startsWith('447') && normalized.length >= 12) {
    normalized = '0' + normalized.substring(2);
  }
  
  return normalized;
}

/**
 * Verify webhook signature from Facebook
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!FB_APP_SECRET) {
    console.warn('[Webhook] FB_APP_SECRET not configured, skipping signature verification');
    return true; // Allow in development
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', FB_APP_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
    
  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}
