import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FraudPreventionHeaderService } from '../services/hmrc/fraudPrevention/fraudPreventionHeaderService';
import { FraudPreventionHeaders } from '../services/hmrc/fraudPrevention/types';

/**
 * HMRC Fraud Prevention Middleware
 * 
 * This middleware attaches the required fraud prevention headers to all HMRC API requests.
 * It works alongside the HMRC authentication middleware to ensure all requests to HMRC
 * APIs include both authentication and fraud prevention headers.
 */

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
 * HMRC Fraud Prevention Middleware
 * 
 * This middleware attaches the required fraud prevention headers to all HMRC API requests.
 */
export async function hmrcFraudPreventionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // Get user ID from session
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the fraud prevention header service
    const headerService = FraudPreventionHeaderService.getInstance();
    
    // Generate the fraud prevention headers
    const headers = await headerService.generateHeaders(userId);
    
    if (!headers) {
      console.error('Failed to generate fraud prevention headers for user:', userId);
      return NextResponse.json(
        { error: 'Failed to generate fraud prevention headers', code: 'HMRC_HEADERS_ERROR' },
        { status: 500 }
      );
    }
    
    // Validate the headers
    const validation = headerService.validateHeaders(headers);
    
    if (!validation.valid) {
      console.error('Missing required fraud prevention headers:', validation.missing);
      return NextResponse.json(
        { 
          error: 'Missing required fraud prevention headers', 
          code: 'HMRC_MISSING_HEADERS',
          missing: validation.missing
        },
        { status: 500 }
      );
    }
    
    // Create a new headers object with all the original headers
    const newHeaders = new Headers(request.headers);
    
    // Add all fraud prevention headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        newHeaders.set(key, value);
      }
    });
    
    // Clone the request with the new headers
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: request.redirect,
      signal: request.signal,
    });
    
    // Return the modified request
    return NextResponse.next({
      request: newRequest,
    });
  } catch (error) {
    console.error('Error in HMRC fraud prevention middleware:', error);
    
    return NextResponse.json(
      { 
        error: 'Error in fraud prevention middleware', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to create a route handler with HMRC fraud prevention headers
 * 
 * Usage example:
 * 
 * export const GET = withHmrcFraudPrevention(async (req) => {
 *   // Your handler code here
 *   return NextResponse.json({ success: true });
 * });
 */
export function withHmrcFraudPrevention(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const middlewareResponse = await hmrcFraudPreventionMiddleware(req);
    
    if (middlewareResponse && 'body' in middlewareResponse) {
      // If middleware returned a response with a body, return it directly
      return middlewareResponse;
    }
    
    // Otherwise, call the handler with the (potentially modified) request
    return handler(middlewareResponse?.request || req);
  };
}
