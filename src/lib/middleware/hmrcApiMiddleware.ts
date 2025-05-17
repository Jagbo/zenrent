import { NextRequest, NextResponse } from 'next/server';
import { hmrcAuthMiddleware, HmrcAuthMiddlewareOptions } from './hmrcAuthMiddleware';
import { hmrcFraudPreventionMiddleware } from './hmrcFraudPreventionMiddleware';

/**
 * Combined HMRC API Middleware
 * 
 * This middleware combines the HMRC authentication middleware and the fraud prevention
 * middleware to ensure all requests to HMRC APIs include both authentication and
 * fraud prevention headers.
 */

/**
 * HMRC API Middleware
 * 
 * This middleware applies both authentication and fraud prevention headers to HMRC API requests.
 */
export async function hmrcApiMiddleware(
  request: NextRequest,
  authOptions?: HmrcAuthMiddlewareOptions
): Promise<NextResponse | null> {
  try {
    // First apply the authentication middleware
    const authResponse = await hmrcAuthMiddleware(request, authOptions);
    
    // If the auth middleware returned a response, return it directly
    if (authResponse && 'body' in authResponse) {
      return authResponse;
    }
    
    // Otherwise, apply the fraud prevention middleware to the (potentially modified) request
    const fraudPreventionResponse = await hmrcFraudPreventionMiddleware(
      authResponse?.request || request
    );
    
    // Return the response from the fraud prevention middleware
    return fraudPreventionResponse;
  } catch (error) {
    console.error('Error in HMRC API middleware:', error);
    
    return NextResponse.json(
      { 
        error: 'Error in HMRC API middleware', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to create a route handler with HMRC API middleware
 * 
 * This applies both authentication and fraud prevention headers to the request.
 * 
 * Usage example:
 * 
 * export const GET = withHmrcApi(async (req) => {
 *   // Your handler code here
 *   return NextResponse.json({ success: true });
 * });
 */
export function withHmrcApi(
  handler: (req: NextRequest) => Promise<NextResponse>,
  authOptions?: HmrcAuthMiddlewareOptions
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const middlewareResponse = await hmrcApiMiddleware(req, authOptions);
    
    if (middlewareResponse && 'body' in middlewareResponse) {
      // If middleware returned a response with a body, return it directly
      return middlewareResponse;
    }
    
    // Otherwise, call the handler with the (potentially modified) request
    return handler(middlewareResponse?.request || req);
  };
}
