import { NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/server-auth-helpers';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * API endpoint to check HMRC connection status
 * This endpoint doesn't require the user to be connected to HMRC
 */
export async function GET() {
  try {
    // Create Supabase client with the cookies function
    const supabase = createRouteHandlerClient({
      cookies
    });
    
    // Get the session and check for errors
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[API /hmrc/connection-status] Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error', details: sessionError.message },
        { status: 401 }
      );
    }
    
    // Get the authenticated user from the session
    const user = sessionData.session?.user;
    
    if (!user) {
      console.error('[API /hmrc/connection-status] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    
    // Check if the user is connected to HMRC
    const isConnected = await hmrcAuthService.isConnected(user.id);
    
    // Generate auth URL if not connected
    let authUrl = null;
    if (!isConnected) {
      try {
        const authResult = await hmrcAuthService.initiateAuth(user.id);
        authUrl = authResult.authUrl;
      } catch (authError) {
        console.error('[API /hmrc/connection-status] Error generating auth URL:', authError);
      }
    }
    
    // Return the connection status
    return NextResponse.json({
      isConnected,
      userId: user.id,
      authUrl
    });
    
  } catch (error: any) {
    console.error('[API /hmrc/connection-status] Error checking HMRC connection:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check HMRC connection status',
        details: error.message,
        isConnected: false
      },
      { status: 500 }
    );
  }
}
