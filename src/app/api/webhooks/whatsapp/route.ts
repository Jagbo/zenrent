import { NextRequest, NextResponse } from 'next/server';

// This is for webhook verification when Facebook first connects
export async function GET(request: NextRequest) {
  // Log full request for debugging
  console.log('FULL WEBHOOK REQUEST URL:', request.url);
  
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Get verify token from environment variable - updated to simpler token
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'zenrent5512429';
  
  // Detailed debugging information
  console.log('WEBHOOK VERIFICATION DETAILS:', { 
    mode, 
    token,
    challenge,
    expected_token: WHATSAPP_VERIFY_TOKEN,
    matches: token === WHATSAPP_VERIFY_TOKEN,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers)
  });
  
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully - returning challenge:', challenge);
    // Must return just the challenge value as plain text with correct Content-Type
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } else {
    console.log('Webhook verification failed:', {
      modeCheck: mode === 'subscribe',
      tokenCheck: token === WHATSAPP_VERIFY_TOKEN,
      receivedToken: token,
      expectedToken: WHATSAPP_VERIFY_TOKEN
    });
    return new Response('Verification failed', { 
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// This handles incoming messages from WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received webhook event:', JSON.stringify(body, null, 2));
    
    // Process the incoming message or status update
    if (body.object === 'whatsapp_business_account') {
      // Process entries - this is where messages and status updates come in
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Extract the WhatsApp phone number ID (the landlord's number)
            const phoneNumberId = value?.metadata?.phone_number_id;
            
            // Extract the sender's info (the tenant)
            const messages = value?.messages || [];
            if (messages.length > 0) {
              const message = messages[0];
              const from = message.from; // Tenant's phone number
              const messageId = message.id;
              const timestamp = message.timestamp;
              const messageContent = message.text?.body || '';
              
              console.log(`Received message from ${from} to phone ID ${phoneNumberId}: ${messageContent}`);
              
              // TODO: Store the message in your database
              // TODO: Associate with the correct landlord based on phoneNumberId
              // TODO: Notify the landlord via WebSocket or similar
            }
          }
        }
      }
      
      // Acknowledge receipt - always respond with 200 OK quickly
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    // Not a WhatsApp event
    return NextResponse.json({ success: false, error: 'Not a WhatsApp event' }, { status: 400 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 