import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Business Account ID - in production this would be dynamic or from env
const WABA_ID = '596136450071721';

export async function POST(request: NextRequest) {
  try {
    // Get token from environment variable
    const token = process.env.WHATSAPP_TOKEN;
    
    if (!token) {
      return NextResponse.json(
        { error: "WhatsApp token not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { phoneNumber, cc, pin, method = 'sms' } = body;

    if (!phoneNumber || !cc) {
      return NextResponse.json({ 
        success: false, 
        error: "Phone number and country code are required" 
      }, { status: 400 });
    }

    // If pin is provided, we're verifying a phone
    if (pin) {
      return await verifyPhone(token, phoneNumber, cc, pin);
    }
    
    // Otherwise, we're requesting a verification code
    return await requestVerificationCode(token, phoneNumber, cc, method);
  } catch (error) {
    console.error("WhatsApp phone registration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function requestVerificationCode(token: string, phoneNumber: string, cc: string, method: string) {
  // In production, this would call the Graph API to request a verification code
  // POST /{phone-number-ID}/request_code
  
  // For development, we're simulating the response
  console.log(`[DEV] Requesting verification code via ${method} for +${cc}${phoneNumber}`);
  
  return NextResponse.json({
    success: true,
    message: `Verification code requested for +${cc}${phoneNumber}`,
    // This would actually come from the API
    status: 'pending_verification'
  });
}

async function verifyPhone(token: string, phoneNumber: string, cc: string, pin: string) {
  // In production, this would call the Graph API to verify the code
  // POST /{phone-number-ID}/verify_code
  
  // For development, we're simulating the response
  console.log(`[DEV] Verifying phone +${cc}${phoneNumber} with pin ${pin}`);
  
  // Simulate verification success (would check the API response in production)
  return NextResponse.json({
    success: true,
    message: `Phone number +${cc}${phoneNumber} verified successfully`,
    phone: {
      id: '123456789',
      display_phone_number: `+${cc}${phoneNumber}`,
      verified_name: 'ZenRent Testing',
      quality_rating: 'GREEN',
      status: 'connected'
    }
  });
} 