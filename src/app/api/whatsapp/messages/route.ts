import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client with local environment values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Facebook Graph API configuration
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const APP_ID = process.env.FB_APP_ID || '953206047023164';
const APP_SECRET = process.env.FB_APP_SECRET || '76e16d5ea4d3dd0dbb21c41703947995';

// For real implementation, use proper auth with Supabase
// This is a placeholder, replace with actual auth logic
const getUserId = async (request: Request) => {
  // In a real implementation, you would:
  // 1. Extract the user token from the request
  // 2. Validate it against your auth system
  // 3. Return the authenticated user ID
  
  // For now, we'll use a test user for demonstration
  return 'auth-user-id-123';
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get('phone');

  if (!phoneNumber) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  try {
    // Get the authenticated user
    const userId = await getUserId(request);
    
    // Get the user's WhatsApp account
    const { data: accountData, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })
      .limit(1);
    
    if (accountError || !accountData || accountData.length === 0) {
      return NextResponse.json({ error: 'No WhatsApp account found' }, { status: 404 });
    }
    
    // Get messages for this conversation
    const { data: messagesData, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('from_phone', phoneNumber)
      .order('timestamp', { ascending: true });
      
    if (messagesError) {
      return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
    }
    
    // Format messages for the frontend
    const messages = messagesData.map(msg => ({
      id: msg.message_id,
      from: msg.direction === 'inbound' ? 'user' : 'business',
      text: msg.message_content,
      timestamp: msg.timestamp,
      status: msg.status
    }));
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the authenticated user
    const userId = await getUserId(request);
    
    // Get the user's WhatsApp account
    const { data: accountData, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })
      .limit(1);
    
    if (accountError || !accountData || accountData.length === 0) {
      return NextResponse.json({ error: 'No WhatsApp account found' }, { status: 404 });
    }
    
    const account = accountData[0];
    const phoneNumberId = account.phone_number_id;
    
    let messageId = '';
    
    // Send the WhatsApp message via Cloud API
    try {
      // Get system user token (simplified here - in production use a stored token)
      const tokenResponse = await axios.get(
        `${GRAPH_API_URL}/oauth/access_token?grant_type=client_credentials&client_id=${process.env.FB_APP_ID || APP_ID}&client_secret=${process.env.FB_APP_SECRET || APP_SECRET}`
      );
      const accessToken = tokenResponse.data.access_token;
      
      // Send the message using WhatsApp Cloud API
      const response = await axios.post(
        `${GRAPH_API_URL}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: { body: message }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      // Extract the message ID from the response
      messageId = response.data.messages[0].id;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
    }
    
    // Store the message in the database
    const { data: msgData, error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        waba_id: account.waba_id,
        phone_number_id: phoneNumberId,
        from_phone: account.phone_number,
        to_phone: to,
        message_id: messageId,
        message_type: 'text',
        message_content: message,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        status: 'sent'
      })
      .select()
      .single();
    
    if (msgError) {
      console.error('Error storing message:', msgError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }
    
    // Format the sent message for the frontend
    const sentMessage = {
      id: messageId,
      from: 'business',
      text: message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    return NextResponse.json({ success: true, message: sentMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
} 