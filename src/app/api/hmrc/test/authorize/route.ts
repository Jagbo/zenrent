import { NextResponse } from 'next/server';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    // Get the authenticated user
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Ensure service is initialized
    await hmrcAuthService.ensureInitialized();
    
    // Generate authorization URL
    const { authUrl } = await hmrcAuthService.initiateAuth(user.id);
    
    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Authorization URL generated successfully. Click the link to start OAuth flow.'
    });
    
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (error.message.includes('client credentials not configured') || 
      error.message.includes('Missing HMRC client'));
    
    return NextResponse.json(
      { 
        error: isCredentialsError 
          ? 'HMRC integration is not properly configured. Please contact support.'
          : 'Failed to generate authorization URL',
        isCredentialsError,
        message: error instanceof Error ? error.message : String(error)
      },
      { status: isCredentialsError ? 503 : 500 }
    );
  }
} 