import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-up/account-creation`,
      },
    });

    if (error) {
      throw error;
    }

    // Supabase OAuth returns a URL to redirect to
    if (data?.url) {
      return NextResponse.redirect(data.url);
    }

    // Fallback to home page if no URL is returned
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL('/sign-up?error=oauth_failed', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    );
  }
} 