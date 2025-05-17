import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { HmrcErrorHandler } from './hmrcErrorHandler';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Security utility functions for HMRC integration
 */

export interface SecurityCheckResult {
  valid: boolean;
  userId?: string;
  error?: any;
  session?: any;
}

/**
 * Check if the authenticated user matches the expected user (from OAuth state)
 * @param expectedUserId The user ID expected (from OAuth state parameter)
 * @param requestId A request ID for tracking
 * @param req The Next.js request object
 * @returns Object with validation result and error details if applicable
 */
export async function checkHmrcUserMatch(
  expectedUserId: string,
  requestId: string,
  req: NextRequest
): Promise<SecurityCheckResult> {
  try {
    // Get current user from session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        valid: false,
        error: sessionError,
        session: null
      };
    }
    
    if (!session?.user) {
      return {
        valid: false,
        error: 'No authenticated user found',
        session: null
      };
    }
    
    // Check if user ID matches expected value
    const isValid = session.user.id === expectedUserId;
    
    if (!isValid) {
      // Log security event for mismatched user IDs
      const errorHandler = HmrcErrorHandler.getInstance();
      const clientIp = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';
                       
      try {
        await supabase.from('security_events').insert({
          user_id: session.user.id,
          event_type: 'oauth_user_mismatch',
          details: {
            source: 'hmrc_oauth',
            expected_user_id: expectedUserId,
            actual_user_id: session.user.id,
            client_ip: clientIp,
            request_id: requestId
          },
          severity: 'high'
        });
      } catch (e) {
        console.error('Failed to log security event:', e);
      }
    }
    
    return {
      valid: isValid,
      userId: session.user.id,
      session
    };
  } catch (error) {
    console.error('Error checking user match:', error);
    return {
      valid: false,
      error
    };
  }
}

/**
 * Get the client IP address from a request
 */
export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Check if a request exceeds rate limits and log the event
 */
export async function checkRateLimits(
  req: NextRequest,
  userId?: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const errorHandler = HmrcErrorHandler.getInstance();
  const clientIp = getClientIp(req);
  
  // Check rate limits
  const result = await errorHandler.checkRateLimit(clientIp);
  
  // If rate limited and we have a user ID, log it
  if (!result.allowed && userId) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'rate_limit_exceeded',
        details: {
          source: 'hmrc_oauth',
          client_ip: clientIp,
          retry_after: result.retryAfter,
          path: req.nextUrl.pathname
        },
        severity: 'medium'
      });
    } catch (e) {
      console.error('Failed to log rate limit event:', e);
    }
  }
  
  return result;
} 