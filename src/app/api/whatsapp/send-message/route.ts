import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    // Get the authenticated user (landlord)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[WhatsApp Send] Message request from landlord ${user.id}`);

    // Parse request body
    const body = await request.json();
    const { to, message, messageType = 'text' } = body;

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recipient phone number and message are required' 
      }, { status: 400 });
    }

    // Validate phone number format - should be E.164 without the +
    if (!/^\d+$/.test(to)) {
      return NextResponse.json({
        success: false,
        error: 'Recipient phone number should only contain digits (E.164 format without +)'
      }, { status: 400 });
    }

    // Check if landlord has WhatsApp enabled
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('whatsapp_enabled, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[WhatsApp Send] Error fetching user profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify user profile' },
        { status: 500 }
      );
    }

    if (!userProfile?.whatsapp_enabled) {
      console.warn(`[WhatsApp Send] User ${user.id} attempted to send message but WhatsApp is not enabled`);
      return NextResponse.json(
        { success: false, error: 'WhatsApp messaging is not enabled for your account' },
        { status: 403 }
      );
    }

    // Verify the recipient is a tenant of this landlord
    const { data: tenantRouting, error: routingError } = await supabase
      .rpc('get_landlord_by_tenant_phone', { phone_number: to });

    if (routingError) {
      console.error('[WhatsApp Send] Error checking tenant routing:', routingError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify recipient' },
        { status: 500 }
      );
    }

    if (!tenantRouting || tenantRouting.length === 0) {
      console.warn(`[WhatsApp Send] Phone ${to} is not associated with any tenant of landlord ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'Recipient is not one of your tenants' },
        { status: 403 }
      );
    }

    const tenantInfo = tenantRouting[0];
    if (tenantInfo.landlord_id !== user.id) {
      console.warn(`[WhatsApp Send] Phone ${to} belongs to a different landlord`);
      return NextResponse.json(
        { success: false, error: 'Recipient is not one of your tenants' },
        { status: 403 }
      );
    }

    // Get central WhatsApp configuration
    const centralPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
    
    if (!centralPhoneId || !token) {
      console.error('[WhatsApp Send] Central WhatsApp configuration missing');
      return NextResponse.json(
        { success: false, error: 'WhatsApp integration is not configured on the server' },
        { status: 500 }
      );
    }

    // Create landlord attribution
    const landlordName = userProfile.first_name && userProfile.last_name 
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : userProfile.first_name || userProfile.last_name || 'Your Landlord';

    // Prefix message with landlord attribution
    const attributedMessage = `*From ${landlordName} (via ZenRent):*\n\n${message}`;

    console.log(`[WhatsApp Send] Sending message from ${landlordName} to tenant ${tenantInfo.tenant_name} (${to})`);

    // Use production API or mock based on environment
    const useRealApi = process.env.WHATSAPP_API_URL && process.env.NODE_ENV === 'production';
    
    let result;
    if (useRealApi) {
      result = await sendRealWhatsAppMessage(token, centralPhoneId, to, attributedMessage, messageType);
    } else {
      result = await sendMockWhatsAppMessage(token, centralPhoneId, to, attributedMessage, messageType, landlordName, tenantInfo.tenant_name);
    }

    // Log the message to database for conversation history if successful
    if (result.status === 200) {
      try {
        const messageData = await result.clone().json();
        const messageId = messageData.messages?.[0]?.id || `dev_${Date.now()}`;
        
        await logMessage(supabase, {
          landlord_id: user.id,
          tenant_phone: to,
          tenant_name: tenantInfo.tenant_name,
          property_address: tenantInfo.property_address,
          message_id: messageId,
          message_content: message, // Store original message without attribution
          attributed_message: attributedMessage, // Store the sent message with attribution
          direction: 'outgoing',
          message_type: messageType,
          status: 'sent'
        });

        console.log(`[WhatsApp Send] Message logged with ID: ${messageId}`);
      } catch (logError) {
        console.error('[WhatsApp Send] Error logging message:', logError);
        // Don't fail the request if logging fails
      }
    }

    return result;

  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function sendRealWhatsAppMessage(
  token: string, 
  phoneNumberId: string, 
  to: string, 
  message: string, 
  messageType: string
) {
  // Use a consistent Graph API version
  const GRAPH_API_VERSION = 'v18.0';
  const apiUrl = process.env.WHATSAPP_API_URL || `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  const endpoint = `${apiUrl}/${phoneNumberId}/messages`;
  
  // Prepare request payload based on message type
  let requestBody: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: messageType,
  };
  
  // Add the appropriate content based on message type
  if (messageType === 'text') {
    requestBody.text = { body: message };
  } else if (messageType === 'template') {
    // Parse template message as JSON if it's a string
    const templateData = typeof message === 'string' ? JSON.parse(message) : message;
    requestBody.template = templateData;
  } else if (messageType === 'image' || messageType === 'document' || messageType === 'video' || messageType === 'audio') {
    // For media messages
    requestBody[messageType] = {
      link: message
    };
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp API] Error:', errorData);
      
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'Failed to send WhatsApp message',
        details: errorData
      }, { status: response.status });
    }
    
    const responseData = await response.json();
    console.log('[WhatsApp API] Message sent successfully:', responseData.messages?.[0]?.id);
    
    return NextResponse.json({
      success: true,
      ...responseData
    });
  } catch (error) {
    console.error('[WhatsApp API] Call failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to call WhatsApp API',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function sendMockWhatsAppMessage(
  token: string, 
  phoneNumberId: string, 
  to: string, 
  message: string, 
  messageType: string,
  landlordName: string,
  tenantName: string
) {
  // Log the request details for development
  console.log(`[DEV] Sending WhatsApp message:`);
  console.log(`  From: ${landlordName} (via ZenRent central number: ${phoneNumberId})`);
  console.log(`  To: ${tenantName} (${to})`);
  console.log(`  Type: ${messageType}`);
  console.log(`  Message:`, message);
  
  // Simulate a slight delay like a real API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate message success
  const messageId = `mock_msg_${Date.now()}`;
  
  return NextResponse.json({
    success: true,
    messaging_product: 'whatsapp',
    contacts: [
      {
        input: to,
        wa_id: to
      }
    ],
    messages: [
      {
        id: messageId
      }
    ]
  });
}

async function logMessage(supabase: any, messageData: {
  landlord_id: string;
  tenant_phone: string;
  tenant_name: string;
  property_address: string;
  message_id: string;
  message_content: string;
  attributed_message: string;
  direction: 'incoming' | 'outgoing';
  message_type: string;
  status: string;
}) {
  try {
    const { error } = await supabase
      .from('whatsapp_messages_centralized')
      .insert({
        landlord_id: messageData.landlord_id,
        tenant_phone: messageData.tenant_phone,
        tenant_name: messageData.tenant_name,
        property_address: messageData.property_address,
        message_id: messageData.message_id,
        message_content: messageData.message_content,
        attributed_message: messageData.attributed_message,
        direction: messageData.direction,
        message_type: messageData.message_type,
        status: messageData.status,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('[WhatsApp Send] Error logging message:', error);
    } else {
      console.log('[WhatsApp Send] Message logged successfully');
    }
  } catch (error) {
    console.error('[WhatsApp Send] Exception logging message:', error);
  }
} 