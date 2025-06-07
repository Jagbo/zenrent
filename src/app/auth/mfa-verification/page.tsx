'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MFAVerification from '@/components/auth/MFAVerification'

function MFAVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [returnTo, setReturnTo] = useState<string>('/dashboard')

  useEffect(() => {
    const returnToParam = searchParams.get('returnTo')
    if (returnToParam) {
      setReturnTo(returnToParam)
    }
  }, [searchParams])

  const handleSuccess = () => {
    // Redirect to the original destination or dashboard
    router.push(returnTo)
  }

  const handleCancel = () => {
    // Redirect to login page
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please verify your identity to continue
          </p>
        </div>
        <MFAVerification
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

export default function MFAVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MFAVerificationForm />
    </Suspense>
  )
} 