import { NextResponse } from 'next/server';
import { getServerAuthUser } from '@/lib/server-auth-helpers';
import { HmrcAuthService } from '@/lib/services/hmrc/hmrcAuthService';
import { TokenStorageService } from '@/lib/services/security/tokenStorageService';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to test the complete HMRC authentication flow
 * This endpoint helps diagnose issues with the authentication process
 */
export async function GET() {
  try {
    // Get the authenticated user
    const user = await getServerAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize HMRC auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    
    // Initialize token storage service
    const tokenStorageService = TokenStorageService.getInstance();
    await tokenStorageService.initialize();
    
    // Check if the user is connected to HMRC
    const isConnected = await hmrcAuthService.isConnected(user.id);
    
    // Create a direct Supabase client for advanced diagnostics
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });
    
    // Check for code verifiers in the database
    const { data: codeVerifiers, error: codeVerifierError } = await supabase
      .from('code_verifiers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Check for tokens in the database
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'hmrc')
      .limit(1);
    
    // Generate a new auth URL if not connected
    let authUrl = null;
    let codeVerifier = null;
    
    if (!isConnected) {
      try {
        const authResult = await hmrcAuthService.initiateAuth(user.id);
        authUrl = authResult.authUrl;
        
        // Get the newly created code verifier for debugging
        const { data: newVerifier } = await supabase
          .from('code_verifiers')
          .select('code_verifier')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (newVerifier) {
          codeVerifier = newVerifier.code_verifier.substring(0, 10) + '...';
        }
      } catch (authError) {
        console.error('[API /hmrc/test-flow] Error generating auth URL:', authError);
      }
    }
    
    // Return comprehensive diagnostic information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      hmrc: {
        isConnected,
        authUrl,
        codeVerifier
      },
      diagnostics: {
        codeVerifiers: codeVerifiers?.map(cv => ({
          id: cv.id,
          created_at: cv.created_at,
          expires_at: cv.expires_at,
          is_expired: new Date(cv.expires_at) < new Date()
        })) || [],
        tokens: tokens?.map(t => ({
          id: t.id,
          created_at: t.created_at,
          expires_at: t.expires_at,
          is_expired: new Date(t.expires_at) < new Date()
        })) || [],
        hasCodeVerifierError: !!codeVerifierError,
        hasTokenError: !!tokenError
      }
    });
  } catch (error) {
    console.error('[API /hmrc/test-flow] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to test HMRC flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
