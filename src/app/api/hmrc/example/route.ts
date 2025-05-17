import { NextRequest, NextResponse } from 'next/server';
import { withHmrcAuth } from '@/lib/middleware/hmrcAuthMiddleware';

/**
 * Example API route that uses HMRC authentication middleware
 * 
 * This demonstrates how to use the HMRC authentication middleware
 * to protect API routes that need to interact with HMRC APIs.
 */

export const GET = withHmrcAuth(async (req: NextRequest) => {
  try {
    // The HMRC token is available on the request object
    // It was attached by the middleware
    const hmrcToken = (req as any).hmrcToken;
    
    // You can now use this token to make requests to HMRC APIs
    // For example, to fetch tax information
    
    return NextResponse.json({
      success: true,
      message: 'Successfully authenticated with HMRC',
      tokenAvailable: !!hmrcToken
    });
  } catch (error) {
    console.error('Error in HMRC example API route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
});

// You can also define POST, PUT, DELETE handlers with HMRC authentication
export const POST = withHmrcAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Process the request...
    
    return NextResponse.json({
      success: true,
      message: 'POST request processed successfully',
      receivedData: body
    });
  } catch (error) {
    console.error('Error in HMRC example API route (POST):', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}, {
  // You can customize middleware options for each handler
  requireAuth: true,
  refreshToken: true,
  attachToken: true
});
