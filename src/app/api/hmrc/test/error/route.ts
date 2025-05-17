import { NextResponse } from 'next/server';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { HmrcErrorHandler } from '@/lib/services/hmrc/hmrcErrorHandler';

export async function GET(req: Request) {
  try {
    // Test the initialization and error handling
    console.log('Testing HMRC Auth Service initialization');
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Ensure service is initialized
    await hmrcAuthService.ensureInitialized();
    
    return NextResponse.json({
      success: true,
      message: 'HMRC Auth Service initialized successfully'
    });
    
  } catch (error) {
    console.error('Error in HMRC test/error endpoint:', error);
    
    // Determine if this is a credentials configuration error
    const isCredentialsError = error instanceof Error && 
      (error.message.includes('client credentials not configured') || 
      error.message.includes('Missing HMRC client'));
    
    return NextResponse.json(
      { 
        error: isCredentialsError 
          ? 'HMRC integration is not properly configured. Please contact support.'
          : 'Failed to initialize HMRC service',
        isCredentialsError,
        message: error instanceof Error ? error.message : String(error)
      },
      { status: isCredentialsError ? 503 : 500 }
    );
  }
} 