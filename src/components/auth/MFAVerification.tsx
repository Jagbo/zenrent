'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Smartphone, Key, AlertCircle, Loader2 } from 'lucide-react'
import { MFAService, UserMFAStatus } from '@/lib/services/mfa'

interface MFAVerificationProps {
  onSuccess: () => void
  onCancel?: () => void
}

export default function MFAVerification({ onSuccess, onCancel }: MFAVerificationProps) {
  const [mfaStatus, setMfaStatus] = useState<UserMFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFactorId, setSelectedFactorId] = useState<string>('')
  const [challengeId, setChallengeId] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [step, setStep] = useState<'select' | 'challenge' | 'verify'>('select')

  useEffect(() => {
    loadMFAStatus()
  }, [])

  const loadMFAStatus = async () => {
    try {
      setLoading(true)
      const status = await MFAService.getUserMFAStatus()
      setMfaStatus(status)
      
      // If user has only one verified factor, auto-select it
      const verifiedFactors = status.factors.filter(f => f.status === 'verified')
      if (verifiedFactors.length === 1) {
        setSelectedFactorId(verifiedFactors[0].id)
        handleChallengeFactor(verifiedFactors[0].id)
      } else if (verifiedFactors.length > 1) {
        setStep('select')
      } else {
        setError('No verified MFA methods found. Please contact support.')
      }
    } catch (error) {
      setError('Failed to load MFA methods')
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeFactor = async (factorId?: string) => {
    const targetFactorId = factorId || selectedFactorId
    if (!targetFactorId) {
      setError('Please select an MFA method')
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const result = await MFAService.challengeFactor(targetFactorId)
      if (result.success && result.challengeId) {
        setChallengeId(result.challengeId)
        setSelectedFactorId(targetFactorId)
        setStep('verify')
      } else {
        setError(result.error || 'Failed to initiate MFA challenge')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code')
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const result = await MFAService.verifyChallenge(selectedFactorId, challengeId, verificationCode)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Invalid verification code')
        setVerificationCode('')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      setVerificationCode('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'verify') {
        handleVerifyCode()
      } else if (step === 'select' && selectedFactorId) {
        handleChallengeFactor()
      }
    }
  }

  const getFactorIcon = (type: string) => {
    return type === 'totp' ? <Key className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />
  }

  const getFactorName = (type: string) => {
    return type === 'totp' ? 'Authenticator App' : 'SMS'
  }

  const getFactorDescription = (type: string) => {
    return type === 'totp' 
      ? 'Enter the 6-digit code from your authenticator app'
      : 'Enter the code sent to your phone'
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const selectedFactor = mfaStatus?.factors.find(f => f.id === selectedFactorId)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Please verify your identity to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Factor Selection */}
        {step === 'select' && mfaStatus && mfaStatus.factors.length > 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Choose verification method:</h3>
            <div className="space-y-2">
              {mfaStatus.factors
                .filter(factor => factor.status === 'verified')
                .map((factor) => (
                <button
                  key={factor.id}
                  onClick={() => setSelectedFactorId(factor.id)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    selectedFactorId === factor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFactorIcon(factor.type)}
                    <div>
                      <p className="font-medium">{getFactorName(factor.type)}</p>
                      <p className="text-sm text-gray-600">
                        {getFactorDescription(factor.type)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button 
              onClick={() => handleChallengeFactor()} 
              disabled={!selectedFactorId || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}

        {/* Code Verification */}
        {step === 'verify' && selectedFactor && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                {getFactorIcon(selectedFactor.type)}
                {getFactorName(selectedFactor.type)}
              </div>
              <p className="text-sm text-gray-600">
                {getFactorDescription(selectedFactor.type)}
              </p>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                className="text-center text-lg tracking-widest"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setStep('select')
                  setVerificationCode('')
                  setError('')
                }} 
                variant="outline" 
                className="flex-1"
                disabled={isVerifying}
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={isVerifying || verificationCode.length < 4}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>

            {selectedFactor.type === 'phone' && (
              <Button 
                onClick={() => handleChallengeFactor()} 
                variant="ghost" 
                size="sm"
                disabled={isVerifying}
                className="w-full"
              >
                Resend code
              </Button>
            )}
          </div>
        )}

        {onCancel && (
          <div className="pt-4 border-t">
            <Button onClick={onCancel} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 