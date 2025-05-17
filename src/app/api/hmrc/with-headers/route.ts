import { NextRequest, NextResponse } from 'next/server';
import { withHmrcApi } from '@/lib/middleware/hmrcApiMiddleware';

/**
 * Example API route that uses the combined HMRC API middleware
 * 
 * This demonstrates how to use the HMRC API middleware to protect API routes
 * that need to interact with HMRC APIs. The middleware automatically attaches
 * both authentication and fraud prevention headers to the request.
 */

export const GET = withHmrcApi(async (req: NextRequest) => {
  try {
    // The HMRC token is available on the request object
    // It was attached by the authentication middleware
    const hmrcToken = (req as any).hmrcToken;
    
    // The fraud prevention headers are also attached to the request
    // You can inspect them for debugging purposes
    const headers = Object.fromEntries(req.headers.entries());
    const fraudPreventionHeaders = Object.keys(headers)
      .filter(key => key.startsWith('Gov-'))
      .reduce((obj, key) => {
        obj[key] = headers[key];
        return obj;
      }, {} as Record<string, string>);
    
    // You can now use this request with all required headers to make requests to HMRC APIs
    
    return NextResponse.json({
      success: true,
      message: 'Successfully authenticated with HMRC and attached fraud prevention headers',
      tokenAvailable: !!hmrcToken,
      fraudPreventionHeaders
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

// You can also define POST, PUT, DELETE handlers with HMRC API middleware
export const POST = withHmrcApi(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    // Process the request...
    
    return NextResponse.json({
      success: true,
      message: 'POST request processed successfully with HMRC headers',
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
  // You can customize authentication middleware options
  requireAuth: true,
  refreshToken: true,
  attachToken: true
});
