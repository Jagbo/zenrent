'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireMFA?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireMFA = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading, mfaRequired, mfaVerified } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!user) {
      router.push(redirectTo)
      return
    }

    // MFA is required but not verified
    if (requireMFA && mfaRequired && !mfaVerified) {
      router.push('/auth/mfa-verification')
      return
    }
  }, [user, loading, mfaRequired, mfaVerified, requireMFA, redirectTo, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // MFA required but not verified
  if (requireMFA && mfaRequired && !mfaVerified) {
    return null
  }

  return <>{children}</>
} 