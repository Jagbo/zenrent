import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    // Get the authenticated user (landlord)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant phone number from query parameters
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log(`[Messages API] Fetching messages for landlord ${user.id} and tenant phone ${phone}`);

    // Normalize phone number to match our routing format
    let normalizedPhone = phone.replace(/\D/g, '');
    
    // Handle UK numbers: convert 447xxx to 07xxx format
    if (normalizedPhone.startsWith('447') && normalizedPhone.length === 13) {
      normalizedPhone = '0' + normalizedPhone.substring(2);
    }
    
    // Add space after UK area code for consistency
    if (normalizedPhone.startsWith('07') && normalizedPhone.length === 11) {
      normalizedPhone = normalizedPhone.substring(0, 5) + ' ' + normalizedPhone.substring(5);
    }

    // Fetch messages from centralized table for this landlord-tenant conversation
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages_centralized')
      .select(`
        id,
        whatsapp_message_id,
        direction,
        from_phone,
        to_phone,
        message_type,
        message_body,
        media_url,
        status,
        timestamp,
        delivered_at,
        read_at,
        tenant_name,
        contact_name
      `)
      .eq('landlord_id', user.id)
      .eq('tenant_phone', normalizedPhone)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('[Messages API] Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform messages to match the expected format
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      from: msg.direction === 'incoming' ? 'user' : 'business',
      text: msg.message_body || '[Media message]',
      timestamp: msg.timestamp,
      status: msg.status,
      messageId: msg.whatsapp_message_id,
      messageType: msg.message_type,
      mediaUrl: msg.media_url,
      deliveredAt: msg.delivered_at,
      readAt: msg.read_at
    }));

    console.log(`[Messages API] Retrieved ${formattedMessages.length} messages for conversation`);

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      conversationInfo: {
        tenantPhone: normalizedPhone,
        tenantName: messages?.[0]?.tenant_name || messages?.[0]?.contact_name,
        messageCount: formattedMessages.length
      }
    });

  } catch (error) {
    console.error('[Messages API] Exception in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    // Get the authenticated user (landlord)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    console.log(`[Messages API] Sending message from landlord ${user.id} to ${to}`);

    // Use the centralized send-message API
    const response = await fetch(`${request.nextUrl.origin}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        to,
        message,
        messageType: 'text'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Messages API] Send message failed:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to send message' },
        { status: response.status }
      );
    }

    // Return success with message data for UI update
    const messageData = {
      id: data.messageId || `temp_${Date.now()}`,
      from: 'business',
      text: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      messageId: data.messageId
    };

    console.log(`[Messages API] Message sent successfully: ${data.messageId}`);

    return NextResponse.json({
      success: true,
      message: messageData,
      messageId: data.messageId
    });

  } catch (error) {
    console.error('[Messages API] Exception in POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
