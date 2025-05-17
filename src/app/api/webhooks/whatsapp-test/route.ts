import { NextRequest, NextResponse } from 'next/server';

// Webhook verification token (should match what you set in Meta Developer Portal)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'zenrent_webhook_verify_token';

// Super simplified verification endpoint for debugging
export async function GET(request: NextRequest) {
  // Parse the query params
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// Simple echo endpoint to test POST requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook event for debugging
    console.log('Received webhook event:', JSON.stringify(body, null, 2));
    
    // Parse the message from the webhook
    if (body.object === 'whatsapp_business_account') {
      // Process WhatsApp webhook payload
      if (body.entry && body.entry.length > 0) {
        const entry = body.entry[0];
        
        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];
          
          // Check if this is a message event
          if (change.field === 'messages') {
            const value = change.value;
            
            if (value.messages && value.messages.length > 0) {
              // Extract message details
              const message = value.messages[0];
              const from = message.from; // The WhatsApp ID of the user
              const phoneNumberId = value.metadata.phone_number_id;
              
              // Store message in database or process it as needed
              // This would typically involve:
              // 1. Look up which landlord owns this phone_number_id
              // 2. Find the tenant associated with the 'from' number
              // 3. Save the message to the conversation history
              // 4. Notify the landlord if needed
              
              console.log(`Received message from ${from} to phone ${phoneNumberId}`);
              
              // For this test endpoint, we'll just acknowledge receipt
            }
          }
        }
      }
      
      // Always return a 200 OK to acknowledge receipt of the webhook
      return NextResponse.json({ status: 'ok' });
    }
    
    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 