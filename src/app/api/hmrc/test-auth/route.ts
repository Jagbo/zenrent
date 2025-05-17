import { NextResponse } from 'next/server';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { TokenStorageService } from '@/lib/services/security/tokenStorageService';
import { getServerAuthUser } from '@/lib/server-auth-helpers';

export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const user = await getServerAuthUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    const userId = user.id;
    
    // Initialize auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    
    // Check connection status
    const isConnected = await hmrcAuthService.isConnected(userId);
    
    // Generate auth URL if not connected
    let authUrl = null;
    if (!isConnected) {
      const authResult = await hmrcAuthService.initiateAuth(userId);
      authUrl = authResult.authUrl;
    }
    
    // Get token info if connected
    let tokenInfo = null;
    if (isConnected) {
      const tokenStorageService = TokenStorageService.getInstance();
      const token = await tokenStorageService.getToken(userId, 'hmrc');
      
      if (token) {
        tokenInfo = {
          // Mask sensitive data
          access_token: token.access_token ? `${token.access_token.substring(0, 10)}...` : null,
          refresh_token: token.refresh_token ? `${token.refresh_token.substring(0, 10)}...` : null,
          expires_at: token.expires_at,
          scope: token.scope
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      userId,
      isConnected,
      authUrl,
      tokenInfo,
      message: isConnected 
        ? 'User is connected to HMRC' 
        : 'User is not connected to HMRC. Use the authUrl to connect.'
    });
  } catch (error) {
    console.error('Error in HMRC test-auth endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
