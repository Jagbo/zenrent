import { NextResponse } from 'next/server';

// This is a placeholder for actual database storage
// In a real implementation, you'd store this in a database
let wabaConnections: Record<string, any> = {};

export async function POST(request: Request) {
  try {
    const { wabaId, code } = await request.json();

    if (!wabaId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Exchange code for a long-lived token
    // In a real implementation, you'd make an API call to Facebook
    // to exchange the code for a System User Access Token
    
    // For now, we'll just store the WABA ID
    wabaConnections[wabaId] = {
      wabaId,
      connectedAt: new Date().toISOString(),
      // In production, you'd store the access token securely
    };

    return NextResponse.json({ success: true, wabaId });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    return NextResponse.json({ error: 'Failed to connect WhatsApp' }, { status: 500 });
  }
}

export async function GET() {
  // Return all connections (for demo purposes)
  return NextResponse.json({ connections: wabaConnections });
} 