import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';

export async function POST(req: Request) {
  console.log('[API /hmrc/disconnect] Received request');
  
  try {
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      console.error('[API /hmrc/disconnect] No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Ensure service is initialized
    await hmrcAuthService.ensureInitialized();
    
    // Disconnect from HMRC
    const success = await hmrcAuthService.disconnect(user.id);
    
    if (!success) {
      console.error(`[API /hmrc/disconnect] Failed to disconnect user ${user.id} from HMRC`);
      return NextResponse.json(
        { error: 'Failed to disconnect from HMRC' },
        { status: 500 }
      );
    }
    
    console.log(`[API /hmrc/disconnect] Successfully disconnected user ${user.id} from HMRC`);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from HMRC'
    });
  } catch (error) {
    console.error('[API /hmrc/disconnect] Error disconnecting from HMRC:', error);
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (error.message.includes('client credentials not configured') || 
       error.message.includes('Missing HMRC client'));
    
    return NextResponse.json(
      { 
        error: isCredentialsError 
          ? 'HMRC integration is not properly configured. Please contact support.'
          : 'Failed to disconnect from HMRC',
        isCredentialsError
      },
      { status: isCredentialsError ? 503 : 500 }
    );
  }
} 