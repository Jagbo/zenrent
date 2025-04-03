import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with local environment values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Verification token that matches what's set in Facebook App dashboard
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';

// Handle GET requests for webhook verification
export async function GET(request: Request) {
  const url = new URL(request.url);
  
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  // Check if this is a verification request
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    return new Response(challenge, { status: 200 });
  } else {
    console.log('Verification failed. Make sure the verify token matches.');
    return new Response('Verification failed', { status: 403 });
  }
}

// Handle POST requests for incoming messages
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the incoming webhook for debugging
    console.log('Received webhook:', JSON.stringify(body));

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      // Process the entries
      for (const entry of body.entry) {
        // Get the WABA ID
        const wabaId = entry.id;
        
        // Process changes
        for (const change of entry.changes) {
          // Check if it's a messages change
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle different types of messages
            if (value.messages && value.messages.length > 0) {
              // Store each message
              for (const message of value.messages) {
                // Get the metadata for the message
                const phoneNumberId = value.metadata.phone_number_id;
                const from = message.from; // Sender's phone number
                const timestamp = new Date(Number(message.timestamp) * 1000).toISOString();
                
                // Handle different message types
                let messageContent = '';
                let messageType = message.type;
                
                if (message.type === 'text') {
                  messageContent = message.text.body;
                } else if (message.type === 'image') {
                  messageContent = message.image.id;
                } else if (message.type === 'audio') {
                  messageContent = message.audio.id;
                } else if (message.type === 'video') {
                  messageContent = message.video.id;
                } else if (message.type === 'document') {
                  messageContent = message.document.id;
                }
                
                // Store the message in the database
                await storeWhatsAppMessage({
                  wabaId,
                  phoneNumberId,
                  from,
                  messageId: message.id,
                  messageType,
                  messageContent,
                  timestamp,
                  direction: 'inbound'
                });
              }
            }
            
            // Handle message status updates
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await updateMessageStatus(status.id, status.status);
              }
            }
          }
        }
      }
      
      // Return a 200 OK response to acknowledge receipt of the webhook
      return new Response('EVENT_RECEIVED', { status: 200 });
    }
    
    // Not a WhatsApp webhook we're interested in
    return new Response('NOT_SUPPORTED', { status: 404 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('ERROR', { status: 500 });
  }
}

// Helper function to store WhatsApp messages
async function storeWhatsAppMessage(messageData: any) {
  try {
    // Find the landlord ID associated with this WABA
    const { data: wabaData, error: wabaError } = await supabase
      .from('whatsapp_accounts')
      .select('user_id')
      .eq('waba_id', messageData.wabaId)
      .single();
    
    if (wabaError) {
      console.error('Error finding WABA owner:', wabaError);
      return;
    }
    
    // Store the message
    const { error } = await supabase.from('whatsapp_messages').insert({
      user_id: wabaData.user_id,
      waba_id: messageData.wabaId,
      phone_number_id: messageData.phoneNumberId,
      from_phone: messageData.from,
      message_id: messageData.messageId,
      message_type: messageData.messageType,
      message_content: messageData.messageContent,
      timestamp: messageData.timestamp,
      direction: messageData.direction,
      status: 'received'
    });
    
    if (error) {
      console.error('Error storing message:', error);
    }
  } catch (error) {
    console.error('Error in storeWhatsAppMessage:', error);
  }
}

// Helper function to update message status
async function updateMessageStatus(messageId: string, status: string) {
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('message_id', messageId);
    
    if (error) {
      console.error('Error updating message status:', error);
    }
  } catch (error) {
    console.error('Error in updateMessageStatus:', error);
  }
} 