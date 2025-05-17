import { NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/server-auth-helpers';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { HmrcErrorHandler } from '@/lib/services/hmrc/hmrcErrorHandler';

/**
 * API endpoint to initiate HMRC OAuth flow
 * This endpoint generates an authorization URL and redirects the user to HMRC
 */
export async function GET() {
  try {
    // Get the authenticated user using server-side auth
    const user = await getServerAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize error handler
    const errorHandler = HmrcErrorHandler.getInstance();
    // Get a unique request ID for tracking
    const requestId = errorHandler.generateRequestId();
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    
    // Generate auth URL
    const authResult = await hmrcAuthService.initiateAuth(user.id);
    
    // Redirect to the HMRC authorization URL
    return NextResponse.redirect(authResult.authUrl);
  } catch (error) {
    console.error('[API /hmrc/auth/initiate] Error initiating HMRC auth:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const redirectBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (errorMessage.includes('client credentials not configured') || 
       errorMessage.includes('Missing HMRC client'));
    
    // Use a more specific error message for credential configuration issues
    const errorDisplayMessage = isCredentialsError 
      ? 'HMRC integration is not properly configured. Please contact support.'
      : 'An unexpected error occurred while initiating HMRC authorization';
    
    const encodedError = encodeURIComponent(errorDisplayMessage);
    return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}`);
  }
}
