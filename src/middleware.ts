import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // If in development, mock the test user session
  if (process.env.NODE_ENV === 'development') {
    const mockSession = {
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'j.agbodo@mail.com',
        user_metadata: {
          full_name: 'James Agbodo'
        }
      },
      expires_at: Date.now() + 1000 * 60 * 60 * 24 // 24 hours from now
    }

    // Set the mock session in the cookie
    await supabase.auth.setSession(mockSession as any)
  }

  const { data: { session } } = await supabase.auth.getSession()

  return res
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 