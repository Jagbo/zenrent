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

// Get system user token for API calls
const getSystemUserToken = async () => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting system user token:', error);
    throw new Error('Failed to get access token');
  }
};

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const userId = await getUserId(request);
    
    const { wabaId, phoneNumberId: initialPhoneNumberId, code } = await request.json();

    if (!wabaId) {
      return NextResponse.json({ error: 'Missing WhatsApp Business Account ID' }, { status: 400 });
    }

    // Get a system user token for Graph API calls
    // For production, if 'code' is provided, exchange it for user token
    // and then for a system user token with proper permissions
    const accessToken = await getSystemUserToken();
    
    // 1. Subscribe to the WABA for webhooks
    try {
      await axios.post(
        `${GRAPH_API_URL}/${wabaId}/subscribed_apps`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      console.log('Successfully subscribed to WABA webhooks');
    } catch (error) {
      console.error('Error subscribing to WABA webhooks:', error);
      // Continue anyway, as this might be a permission issue that's resolved later
    }
    
    // 2. Get WABA details
    let wabaDetails: any = {};
    try {
      const wabaResponse = await axios.get(
        `${GRAPH_API_URL}/${wabaId}?fields=name,owner_business_id`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      wabaDetails = wabaResponse.data;
    } catch (error) {
      console.error('Error getting WABA details:', error);
      // Continue without details
    }
    
    // 3. Get phone number details if available
    let phoneDetails: any = {};
    let phoneNumber = '';
    let phoneNumberId = initialPhoneNumberId;
    
    if (phoneNumberId) {
      try {
        const phoneResponse = await axios.get(
          `${GRAPH_API_URL}/${phoneNumberId}?fields=display_phone_number,verified_name,status`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        phoneDetails = phoneResponse.data;
        phoneNumber = phoneResponse.data.display_phone_number;
      } catch (error) {
        console.error('Error getting phone details:', error);
        // Continue without phone details
      }
    } else {
      // If no phone ID provided, try to list all phones under the WABA
      try {
        const phonesResponse = await axios.get(
          `${GRAPH_API_URL}/${wabaId}/phone_numbers`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (phonesResponse.data.data && phonesResponse.data.data.length > 0) {
          const firstPhone = phonesResponse.data.data[0];
          phoneNumberId = firstPhone.id;
          phoneNumber = firstPhone.display_phone_number;
          phoneDetails = firstPhone;
        }
      } catch (error) {
        console.error('Error listing phone numbers:', error);
      }
    }
    
    // 4. Store the connection in the database
    const { data, error } = await supabase
      .from('whatsapp_accounts')
      .upsert({
        user_id: userId,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        phone_number: phoneNumber,
        business_name: wabaDetails?.name || '',
        status: 'connected',
        connected_at: new Date().toISOString(),
        metadata: {
          wabaDetails,
          phoneDetails,
          token_info: code ? { code, exchange_time: new Date().toISOString() } : null
        }
      })
      .select();
    
    if (error) {
      console.error('Error storing WhatsApp account:', error);
      return NextResponse.json({ error: 'Failed to store WhatsApp account' }, { status: 500 });
    }
    
    // Return the connection details
    return NextResponse.json({ 
      success: true, 
      wabaId,
      phoneNumberId,
      phoneNumber,
      businessName: wabaDetails?.name || ''
    });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    return NextResponse.json({ error: 'Failed to connect WhatsApp' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const userId = await getUserId(request);
    
    // Get the user's WhatsApp account
    const { data, error } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })
      .limit(1);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch WhatsApp accounts' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ connected: false });
    }
    
    return NextResponse.json({ 
      connected: true,
      account: data[0]
    });
  } catch (error) {
    console.error('Error fetching WhatsApp connection:', error);
    return NextResponse.json({ error: 'Failed to fetch WhatsApp connection' }, { status: 500 });
  }
} 