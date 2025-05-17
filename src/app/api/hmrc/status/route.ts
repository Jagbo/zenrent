import { NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/server-auth-helpers';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Handles both GET and POST requests for checking the HMRC connection status
async function handler(req: Request) {
  console.log('[API /hmrc/status] Received request');
  
  try {
    // Get the authenticated user using server-side auth method
    const user = await getServerAuthUser();
    
    if (!user) {
      console.error('[API /hmrc/status] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For ngrok compatibility, allow passing userId in the request body for POST requests
    let userId = user.id;
    
    // If it's a POST request, check if userId is in the body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        // Only use the userId from the body if it matches the authenticated user
        if (body.userId && body.userId === user.id) {
          userId = body.userId;
        }
      } catch (parseError) {
        // Ignore body parse errors and use the authenticated user ID
      }
    }
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Ensure service is initialized
    await hmrcAuthService.ensureInitialized();
    
    // Check if the user is connected to HMRC
    const isConnected = await hmrcAuthService.isConnected(userId);
    
    console.log(`[API /hmrc/status] HMRC connection status for user ${userId}: ${isConnected}`);
    
    // Return the connection status
    return NextResponse.json({
      isConnected,
      message: isConnected 
        ? 'User is connected to HMRC' 
        : 'User is not connected to HMRC'
    });
  } catch (error) {
    console.error('[API /hmrc/status] Error checking HMRC connection status:', error);
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (error.message.includes('client credentials not configured') || 
       error.message.includes('Missing HMRC client'));
    
    return NextResponse.json(
      { 
        error: isCredentialsError 
          ? 'HMRC integration is not properly configured. Please contact support.'
          : 'Failed to check HMRC connection status',
        isCredentialsError 
      },
      { status: isCredentialsError ? 503 : 500 }
    );
  }
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
} 