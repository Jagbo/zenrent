import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Business Account ID
const WABA_ID = '596136450071721';

// Mock data for development - replace with actual API calls to Meta Graph API
const mockPhoneNumbers = {
  data: [
    {
      id: '123456789',
      display_phone_number: '+447911123456',
      verified_name: 'ZenRent Testing',
      quality_rating: 'GREEN'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Get token from environment variable
    const token = process.env.WHATSAPP_TOKEN;
    
    if (!token) {
      return NextResponse.json(
        { error: "WhatsApp token not configured" },
        { status: 500 }
      );
    }

    // 1. Subscribe your app to the WABA
    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WABA_ID}/subscribed_apps`, 
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    
    const subscribeData = await subscribeResponse.json();
    
    // 2. Get phone numbers
    const phonesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WABA_ID}/phone_numbers`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    
    const phonesData = await phonesResponse.json();
    
    return NextResponse.json({ 
      success: true,
      subscription: subscribeData,
      phones: phonesData
    });
  } catch (error) {
    console.error("WhatsApp setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up WhatsApp integration", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GETMock() {
  try {
    // In production, this would make real Graph API calls to:
    // 1. Check if WABA exists
    // 2. Get phone numbers
    // 3. Check subscription status

    // For now, we're mocking the response
    return NextResponse.json({
      success: true,
      phones: mockPhoneNumbers
    });
  } catch (error) {
    console.error('WhatsApp setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 