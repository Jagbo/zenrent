import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function mfaMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // User not authenticated, let auth middleware handle this
      return response
    }

    // Skip MFA check for MFA-related routes to prevent infinite redirects
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/api/auth/mfa') ||
      pathname.startsWith('/settings/mfa') ||
      pathname.includes('mfa-verification') ||
      pathname.includes('mfa-setup')
    ) {
      return response
    }

    // Check if user has MFA preferences
    const { data: preferences } = await supabase
      .from('user_mfa_preferences')
      .select('mfa_required, last_mfa_login')
      .eq('user_id', user.id)
      .single()

    // If MFA is not required, continue
    if (!preferences?.mfa_required) {
      return response
    }

    // Check if user has completed MFA recently (within session)
    const lastMfaLogin = preferences.last_mfa_login
    if (lastMfaLogin) {
      const lastMfaTime = new Date(lastMfaLogin).getTime()
      const now = new Date().getTime()
      const sessionDuration = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
      
      if (now - lastMfaTime < sessionDuration) {
        // MFA session is still valid
        return response
      }
    }

    // Check if user has enrolled MFA factors
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasVerifiedFactors = (factors?.totp?.length || 0) + (factors?.phone?.length || 0) > 0

    if (!hasVerifiedFactors) {
      // User has MFA required but no factors enrolled, redirect to setup
      const redirectUrl = new URL('/settings/mfa', request.url)
      redirectUrl.searchParams.set('setup', 'required')
      return NextResponse.redirect(redirectUrl)
    }

    // User needs to complete MFA verification
    const redirectUrl = new URL('/auth/mfa-verification', request.url)
    redirectUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('MFA middleware error:', error)
    // On error, allow the request to continue to avoid breaking the app
    return response
  }
}

export function shouldApplyMfaMiddleware(pathname: string): boolean {
  // Apply MFA middleware to protected routes
  const protectedRoutes = [
    '/dashboard',
    '/properties',
    '/residents',
    '/finances',
    '/settings',
    '/tax',
    '/issues',
    '/suppliers'
  ]

  // Skip for API routes (except specific ones), auth routes, and public routes
  const skipRoutes = [
    '/api/',
    '/auth/',
    '/login',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/privacy-policy',
    '/_next/',
    '/favicon.ico'
  ]

  // Check if should skip
  for (const route of skipRoutes) {
    if (pathname.startsWith(route)) {
      return false
    }
  }

  // Check if should apply
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route)) {
      return true
    }
  }

  return false
} 