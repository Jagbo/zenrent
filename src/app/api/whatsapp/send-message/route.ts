import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get token from environment variable
    const token = process.env.WHATSAPP_TOKEN;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "WhatsApp token not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { phoneNumberId, to, message, messageType = 'text' } = body;

    if (!phoneNumberId || !to || !message) {
      return NextResponse.json({ 
        success: false, 
        error: "Phone number ID, recipient number, and message are required" 
      }, { status: 400 });
    }

    // Validate phone number format - should be E.164 without the +
    if (!/^\d+$/.test(to)) {
      return NextResponse.json({
        success: false,
        error: "Recipient phone number should only contain digits (E.164 format without +)"
      }, { status: 400 });
    }
    
    // Use production API or mock based on environment
    const useRealApi = process.env.WHATSAPP_API_URL && process.env.NODE_ENV === 'production';
    
    if (useRealApi) {
      return await sendRealWhatsAppMessage(token, phoneNumberId, to, message, messageType);
    } else {
      return await sendMockWhatsAppMessage(token, phoneNumberId, to, message, messageType);
    }
  } catch (error) {
    console.error("WhatsApp message error:", error);
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
  const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
  const endpoint = `${apiUrl}/${phoneNumberId}/messages`;
  
  // Prepare request payload based on message type
  let requestBody: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
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
      console.error('WhatsApp API error:', errorData);
      
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'Failed to send WhatsApp message',
        details: errorData
      }, { status: response.status });
    }
    
    const responseData = await response.json();
    
    return NextResponse.json({
      success: true,
      ...responseData
    });
  } catch (error) {
    console.error('WhatsApp API call failed:', error);
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
  messageType: string
) {
  // Log the request details for development
  console.log(`[DEV] Sending WhatsApp message to ${to} from phone ID ${phoneNumberId}`);
  console.log(`[DEV] Message type: ${messageType}`);
  console.log(`[DEV] Message content:`, typeof message === 'string' ? message : JSON.stringify(message, null, 2));
  
  // Simulate a slight delay like a real API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate message success
  const messageId = `mock_msg_${Date.now()}`;
  
  return NextResponse.json({
    success: true,
    messaging_product: "whatsapp",
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