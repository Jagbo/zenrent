import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HmrcAuthService } from '../services/hmrc/hmrcAuthService';
import { HmrcErrorHandler, ErrorCategory } from '../services/hmrc/hmrcErrorHandler';

/**
 * HMRC Authentication Middleware
 * 
 * This middleware validates HMRC authentication tokens and attaches them to requests
 * to HMRC API endpoints. It handles token refresh automatically when needed.
 */

export interface HmrcAuthMiddlewareOptions {
  requireAuth?: boolean; // If true, will return 401 if user is not authenticated with HMRC
  refreshToken?: boolean; // If true, will attempt to refresh token if expired
  attachToken?: boolean; // If true, will attach token to request headers
}

/**
 * Default middleware options
 */
const defaultOptions: HmrcAuthMiddlewareOptions = {
  requireAuth: true,
  refreshToken: true,
  attachToken: true
};

/**
 * Create Supabase client for server-side operations
 */
function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Extract user ID from Supabase session
 */
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get session from cookie
    const cookieStore = request.cookies;
    const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseAuthToken) {
      return null;
    }
    
    // Verify the session
    const { data: { user }, error } = await supabase.auth.getUser(supabaseAuthToken);
    
    if (error || !user) {
      console.error('Error getting user from session:', error);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error extracting user ID from session:', error);
    return null;
  }
}

/**
 * HMRC Authentication Middleware Handler
 * 
 * This function can be used as middleware for API routes that need to interact with HMRC APIs.
 * It validates the user's HMRC authentication, refreshes tokens if needed, and attaches
 * the access token to the request headers.
 */
export async function hmrcAuthMiddleware(
  request: NextRequest,
  options: HmrcAuthMiddlewareOptions = defaultOptions
): Promise<NextResponse | null> {
  try {
    const mergedOptions = { ...defaultOptions, ...options };
    const { requireAuth, refreshToken, attachToken } = mergedOptions;
    
    // Get user ID from session
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      if (requireAuth) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      return null; // Continue without authentication
    }
    
    // Initialize HMRC Auth Service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    
    // Check if user is connected to HMRC
    const isConnected = await hmrcAuthService.isConnected(userId);
    
    if (requireAuth && !isConnected) {
      return NextResponse.json(
        { error: 'HMRC authorization required', code: 'HMRC_AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    
    // If user is connected and we need to attach a token
    if (isConnected && attachToken) {
      // Get a valid token (will refresh if needed)
      const accessToken = refreshToken 
        ? await hmrcAuthService.getValidToken(userId)
        : await hmrcAuthService.getAccessToken(userId);
      
      if (!accessToken && requireAuth) {
        return NextResponse.json(
          { error: 'Failed to obtain valid HMRC token', code: 'HMRC_TOKEN_ERROR' },
          { status: 401 }
        );
      }
      
      // Clone the request and add the token to headers
      if (accessToken) {
        // Create a new headers object with all the original headers
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Authorization', `Bearer ${accessToken}`);
        
        // Clone the request with the new headers
        const newRequest = new Request(request.url, {
          method: request.method,
          headers: newHeaders,
          body: request.body,
          redirect: request.redirect,
          signal: request.signal,
        });
        
        // Store the token in the request for downstream handlers
        (newRequest as any).hmrcToken = accessToken;
        
        // Return the modified request
        return NextResponse.next({
          request: newRequest,
        });
      }
    }
    
    // Continue with the request pipeline
    return null;
  } catch (error) {
    console.error('Error in HMRC auth middleware:', error);
    const errorHandler = HmrcErrorHandler.getInstance();
    
    // Get user ID from the current request if available
    // Create a structured error with authentication error category
    const oauthError = errorHandler.createOAuthError(
      error,
      undefined, // We don't have userId here
      undefined,
      { category: ErrorCategory.AUTHENTICATION_ERROR, context: 'HMRC authentication middleware' }
    );
    
    // Log the error
    errorHandler.logError(oauthError).catch(err => {
      console.error('Failed to log API error:', err);
    });
    
    // Create an error response
    const errorResponse = errorHandler.createErrorResponse(oauthError);
    
    // Extract error details from the error response object
    const errorDetails = {
      message: errorResponse.message || 'HMRC authentication error',
      code: errorResponse.code || 'HMRC_AUTH_ERROR',
      status: 500
    };
    
    // If there's a recovery action, add it to the details
    if (errorResponse.recoveryAction) {
      (errorDetails as any).recoveryAction = errorResponse.recoveryAction;
    }
    
    return NextResponse.json(
      { error: errorDetails.message, code: errorDetails.code },
      { status: errorDetails.status }
    );
  }
}

/**
 * Higher-order function to create a route handler with HMRC authentication
 * 
 * Usage example:
 * 
 * export const GET = withHmrcAuth(async (req) => {
 *   // Your handler code here
 *   // Access token is available as req.hmrcToken
 *   return NextResponse.json({ success: true });
 * });
 */
export function withHmrcAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: HmrcAuthMiddlewareOptions = defaultOptions
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const middlewareResponse = await hmrcAuthMiddleware(req, options);
    
    if (middlewareResponse) {
      // If middleware returned a response, return it directly
      return middlewareResponse;
    }
    
    // Otherwise, call the handler with the (potentially modified) request
    return handler(req);
  };
}
