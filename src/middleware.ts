import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { queueUserForEnrichment } from "./services/backgroundEnrichmentService";

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/properties',
  '/residents',
  '/finances',
  '/settings',
  '/issues',
  '/suppliers',
  '/tax',
  '/calendar',
  '/onboarding',
  '/billing'
];

// Routes that don't require MFA verification (but still require auth)
const mfaExemptRoutes = [
  '/settings',
  '/auth/mfa-verification'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/',
  '/api/auth',
  '/api/webhook'
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res;
  }

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, check MFA requirements
  if (session && protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      // Check if user has MFA preferences
      const { data: preferences } = await supabase
        .from('user_mfa_preferences')
        .select('mfa_required, last_mfa_login, enrollment_completed_at')
        .eq('user_id', session.user.id)
        .single();

      const isMfaRequired = preferences?.mfa_required || false;
      const isEnrolled = !!preferences?.enrollment_completed_at;
      
      // If MFA is required but user hasn't enrolled, redirect to MFA setup
      if (isMfaRequired && !isEnrolled && !pathname.startsWith('/settings/mfa')) {
        const redirectUrl = new URL('/settings/mfa', req.url);
        redirectUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // If MFA is required and enrolled, check if verification is needed
      if (isMfaRequired && isEnrolled && !mfaExemptRoutes.some(route => pathname.startsWith(route))) {
        const lastMfaLogin = preferences?.last_mfa_login;
        
        if (!lastMfaLogin) {
          // Never completed MFA verification
          const redirectUrl = new URL('/auth/mfa-verification', req.url);
          redirectUrl.searchParams.set('returnUrl', pathname);
          return NextResponse.redirect(redirectUrl);
        }

        // Check if MFA session has expired (8 hours)
        const lastMfaTime = new Date(lastMfaLogin).getTime();
        const now = new Date().getTime();
        const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours

        if (now - lastMfaTime > sessionDuration) {
          const redirectUrl = new URL('/auth/mfa-verification', req.url);
          redirectUrl.searchParams.set('returnUrl', pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error('Error checking MFA status in middleware:', error);
      // Continue without MFA check if there's an error
    }
  }

  // If user is authenticated, trigger property enrichment in the background
  if (session?.user) {
    // Only trigger on dashboard or property-related pages to avoid excessive API calls
    const propertyRelatedRoutes = [
      "/dashboard",
      "/properties",
      "/property",
    ];
    
    const isPropertyRelatedRoute = propertyRelatedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route),
    );
    
    if (isPropertyRelatedRoute) {
      // Queue the user for property enrichment in the background
      // We don't await this to avoid blocking the request
      queueUserForEnrichment(session.user.id).catch(err => {
        console.error('Failed to queue user for enrichment:', err);
      });
    }
  }

  return res;
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
