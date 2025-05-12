import { NextResponse } from 'next/server';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { HmrcErrorHandler } from '@/lib/services/hmrc/hmrcErrorHandler';
import { NextRequest } from 'next/server';
import { OAuthErrorType } from '@/lib/services/hmrc/hmrcErrorHandler';

export async function GET(req: NextRequest) {
  console.log('[API /hmrc/oauth/callback] Received OAuth callback');
  
  // Initialize error handler
  const errorHandler = HmrcErrorHandler.getInstance();
  // Get a unique request ID for tracking
  const requestId = errorHandler.generateRequestId();
  
  try {
    // Parse URL and extract parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains the userId
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // Redirect base URL - where to redirect after processing
    const redirectBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Handle errors from HMRC OAuth server
    if (error) {
      console.error(`[API /hmrc/oauth/callback] OAuth error: ${error} - ${errorDescription}`);
      
      // Create structured error and log it
      const oauthError = errorHandler.createOAuthError(
        {
          error,
          error_description: errorDescription,
        },
        (state && state.includes(':') ? state.split(':')[0] : state) || undefined, // userId from state parameter if available
        requestId,
        {
          callbackUrl: req.url,
          route: 'hmrc/oauth/callback'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // If we have a userId, record the auth failure for security monitoring
      if (state) {
        const clientIp = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
                         
        try {
          const cookieStore = cookies();
          const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
          await supabase.rpc('record_hmrc_auth_failure', {
            p_user_id: (state && state.includes(':') ? state.split(':')[0] : state), // Ensure pure UUID
            p_ip_address: clientIp,
            p_error_details: { 
              error, 
              error_description: errorDescription 
            }
          });
        } catch (e) {
          console.error('Failed to record auth failure:', e);
        }
      }
      
      // Get user-friendly message based on the error type
      // Handle potential null by providing a default OAuthErrorType
      const errorType = error ? (error as unknown as OAuthErrorType) : OAuthErrorType.UNKNOWN_ERROR;
      const encodedError = encodeURIComponent(errorHandler.getUserFriendlyMessage(errorType) || 
                                             errorDescription || 
                                             error || 
                                             'Unknown error');
      
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      const oauthError = errorHandler.createOAuthError(
        {
          error: 'invalid_request',
          error_description: 'Missing required parameters (code or state)',
          status: 400
        },
        undefined,
        requestId,
        {
          callbackUrl: req.url,
          missingParams: !code ? 'code' : 'state',
          route: 'hmrc/oauth/callback'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Redirect to tax filing page with error
      const encodedError = encodeURIComponent('Missing required OAuth parameters');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    // Check rate limits to prevent abuse
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const { allowed, retryAfter } = await errorHandler.checkRateLimit(clientIp);
    if (!allowed) {
      const oauthError = errorHandler.createOAuthError(
        {
          error: 'rate_limit_exceeded',
          error_description: 'Too many authorization attempts',
          status: 429
        },
        (state && state.includes(':') ? state.split(':')[0] : state), // Parse state for userId
        requestId,
        { 
          clientIp,
          retryAfter,
          route: 'hmrc/oauth/callback'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Redirect to tax filing page with rate limit error
      const encodedError = encodeURIComponent('Too many authorization attempts. Please try again later.');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&retry_after=${retryAfter}&request_id=${requestId}`);
    }
    
    // Initialize auth service to handle the callback
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Ensure service is initialized before proceeding
    await hmrcAuthService.ensureInitialized();
    
    // Exchange code for tokens
    const tokenResponse = await hmrcAuthService.handleCallback(code, state);
    
    if (!tokenResponse) {
      const oauthError = errorHandler.createOAuthError(
        {
          error: 'server_error',
          error_description: 'Failed to exchange code for tokens',
          status: 500
        },
        (state && state.includes(':') ? state.split(':')[0] : state), // Parse state for userId
        requestId,
        {
          route: 'hmrc/oauth/callback'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Redirect to tax filing page with error
      const encodedError = encodeURIComponent('Failed to complete HMRC authorization');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    console.log(`[API /hmrc/oauth/callback] Successfully exchanged code for tokens for user ${state}`);
    
    // In a real-world scenario, we should validate that the current authenticated user matches
    // the user ID in the state parameter to prevent cross-user attacks
    // For this, let's verify the authenticated user:
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Handle session error
    if (sessionError) {
      const oauthError = errorHandler.createOAuthError(
        sessionError,
        (state && state.includes(':') ? state.split(':')[0] : state), // Parse state for userId
        requestId,
        {
          route: 'hmrc/oauth/callback',
          stage: 'session_validation'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Redirect to tax filing page with error
      const encodedError = encodeURIComponent('Authentication error. Please try again.');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    // Verify the authenticated user matches the state (userId)
    if (!session?.user) {
      // Session missing entirely
      const oauthError = errorHandler.createOAuthError(
        {
          error: 'invalid_session',
          error_description: 'No user session found',
          status: 401
        },
        (state && state.includes(':') ? state.split(':')[0] : state), // Parse state for userId
        requestId,
        {
          route: 'hmrc/oauth/callback',
          stage: 'session_validation'
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Redirect to tax filing page with error
      const encodedError = encodeURIComponent('Authentication error. Please try again.');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    // Extract the UUID part from state (if it contains a separator)
    const stateUserId = state.includes(':') ? state.split(':')[0] : state;
    
    if (session.user.id !== stateUserId) {
      // This could be a security issue - log it as such
      const oauthError = errorHandler.createOAuthError(
        {
          error: 'invalid_state',
          error_description: 'User session mismatch - possible CSRF attack',
          status: 401
        },
        session.user.id,
        requestId,
        {
          route: 'hmrc/oauth/callback',
          stateUserId: state,
          parsedStateUserId: stateUserId,
          sessionUserId: session.user.id,
          potentialSecurity: true
        }
      );
      
      await errorHandler.logError(oauthError);
      
      // Log a security event
      try {
        await supabase.from('security_events').insert({
          user_id: session.user.id,
          event_type: 'oauth_state_mismatch',
          details: {
            source: 'hmrc_oauth_callback',
            stateUserId: state,
            parsedStateUserId: stateUserId,
            sessionUserId: session.user.id,
            requestId
          },
          severity: 'high'
        });
      } catch (e) {
        console.error('Failed to log security event:', e);
      }
      
      // Redirect to tax filing page with error
      const encodedError = encodeURIComponent('Authentication mismatch - please try again');
      return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
    }
    
    // Success! Redirect to tax filing page with success flag
    return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_connected=true&request_id=${requestId}`);
  } catch (error) {
    console.error('[API /hmrc/oauth/callback] Error processing callback:', error);
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (error.message.includes('client credentials not configured') || 
       error.message.includes('Missing HMRC client'));
    
    // Create structured error and log it
    const oauthError = errorHandler.createOAuthError(
      error,
      undefined, // We may not know the userId in a catch-all handler
      requestId,
      {
        route: 'hmrc/oauth/callback',
        stage: 'callback_processing',
        isCredentialsError
      }
    );
    
    await errorHandler.logError(oauthError);
    
    // Redirect to tax filing page with appropriate error
    const redirectBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Use a more specific error message for credential configuration issues
    const errorMessage = isCredentialsError 
      ? 'HMRC integration is not properly configured. Please contact support.'
      : 'An unexpected error occurred during HMRC authorization';
    
    const encodedError = encodeURIComponent(errorMessage);
    return NextResponse.redirect(`${redirectBase}/financial/tax/filing?hmrc_error=${encodedError}&request_id=${requestId}`);
  }
} 