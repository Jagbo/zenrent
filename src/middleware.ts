import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  if (!session && !isPublicRoute) {
    // If not authenticated and trying to access a protected route, redirect to login
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
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
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
