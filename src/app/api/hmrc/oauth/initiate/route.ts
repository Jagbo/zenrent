import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { HmrcErrorHandler } from '@/lib/services/hmrc/hmrcErrorHandler';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Initialize error handler
    const errorHandler = HmrcErrorHandler.getInstance();
    
    // Get user ID from Supabase session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      const error = errorHandler.createOAuthError(
        sessionError || 'No active session found',
        undefined,
        undefined,
        { route: 'hmrc/oauth/initiate' }
      );
      
      return errorHandler.handleApiError(error, req);
    }
    
    const userId = session.user.id;
    
    // Check rate limits to prevent abuse
    const clientIp = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const { allowed, retryAfter } = await errorHandler.checkRateLimit(clientIp);
    if (!allowed) {
      const error = errorHandler.createOAuthError(
        {
          error: 'rate_limit_exceeded',
          error_description: 'Too many authorization attempts',
          status: 429
        },
        userId,
        undefined,
        { 
          clientIp,
          retryAfter,
          route: 'hmrc/oauth/initiate'
        }
      );
      
      await errorHandler.logError(error);
      
      return Response.json(
        {
          status: 'error',
          message: 'Too many requests. Please try again later.',
          retryAfter
        },
        { 
          status: 429,
          headers: { 'Retry-After': retryAfter?.toString() || '60' }
        }
      );
    }
    
    // Initialize auth service and generate auth URL
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    const { authUrl } = await hmrcAuthService.initiateAuth(userId);
    
    return Response.json({
      status: 'success',
      authUrl
    });
  } catch (error) {
    // Handle unexpected errors with the error handler
    console.error('Error in HMRC OAuth initiate:', error);
    
    const errorHandler = HmrcErrorHandler.getInstance();
    return errorHandler.handleApiError(error, req);
  }
}

// Also support POST for compatibility with form submissions
export async function POST(req: NextRequest) {
  return GET(req);
} 