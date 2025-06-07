'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Shield, Key, CheckCircle, AlertCircle } from 'lucide-react'
import { MFAService, UserMFAStatus } from '@/lib/services/mfa'

interface MFASetupProps {
  onComplete?: () => void
  onCancel?: () => void
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [mfaStatus, setMfaStatus] = useState<UserMFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrollmentStep, setEnrollmentStep] = useState<'select' | 'setup' | 'verify'>('select')
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'phone'>('totp')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isEnrolling, setIsEnrolling] = useState(false)

  useEffect(() => {
    loadMFAStatus()
  }, [])

  const loadMFAStatus = async () => {
    try {
      setLoading(true)
      const status = await MFAService.getUserMFAStatus()
      setMfaStatus(status)
    } catch (error) {
      setError('Failed to load MFA status')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEnrollment = async () => {
    setError('')
    setSuccess('')
    setIsEnrolling(true)

    try {
      if (selectedMethod === 'totp') {
        const result = await MFAService.enrollTOTP()
        if (result.success && result.qrCode && result.secret && result.factorId) {
          setQrCode(result.qrCode)
          setSecret(result.secret)
          setFactorId(result.factorId)
          setEnrollmentStep('setup')
        } else {
          setError(result.error || 'Failed to start TOTP enrollment')
        }
      } else {
        if (!phoneNumber) {
          setError('Please enter a phone number')
          return
        }
        const result = await MFAService.enrollPhone(phoneNumber)
        if (result.success && result.factorId) {
          setFactorId(result.factorId)
          setEnrollmentStep('verify')
        } else {
          setError(result.error || 'Failed to start phone enrollment')
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleVerifyEnrollment = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code')
      return
    }

    setError('')
    setIsEnrolling(true)

    try {
      const result = await MFAService.verifyEnrollment(factorId, verificationCode)
      if (result.success) {
        setSuccess('MFA has been successfully enabled!')
        await loadMFAStatus()
        setTimeout(() => {
          onComplete?.()
        }, 2000)
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleUnenroll = async (factorId: string) => {
    setError('')
    setIsEnrolling(true)

    try {
      const result = await MFAService.unenrollFactor(factorId)
      if (result.success) {
        setSuccess('MFA factor removed successfully')
        await loadMFAStatus()
      } else {
        setError(result.error || 'Failed to remove MFA factor')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsEnrolling(false)
    }
  }

  const resetEnrollment = () => {
    setEnrollmentStep('select')
    setQrCode('')
    setSecret('')
    setFactorId('')
    setVerificationCode('')
    setError('')
    setSuccess('')
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Current MFA Status */}
        {mfaStatus && mfaStatus.factors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current MFA Methods</h3>
            {mfaStatus.factors.map((factor) => (
              <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {factor.type === 'totp' ? (
                    <Key className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {factor.type === 'totp' ? 'Authenticator App' : 'SMS Authentication'}
                    </p>
                    <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                      {factor.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnenroll(factor.id)}
                  disabled={isEnrolling}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Enrollment Flow */}
        {enrollmentStep === 'select' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add New MFA Method</h3>
            <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'totp' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="totp">Authenticator App</TabsTrigger>
                <TabsTrigger value="phone">SMS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="totp" className="space-y-4">
                <div className="text-center space-y-2">
                  <Key className="h-12 w-12 text-blue-600 mx-auto" />
                  <h4 className="font-semibold">Authenticator App</h4>
                  <p className="text-sm text-gray-600">
                    Use apps like Google Authenticator, Authy, or 1Password to generate time-based codes
                  </p>
                </div>
                <Button onClick={handleStartEnrollment} disabled={isEnrolling} className="w-full">
                  {isEnrolling ? 'Setting up...' : 'Set up Authenticator'}
                </Button>
              </TabsContent>
              
              <TabsContent value="phone" className="space-y-4">
                <div className="text-center space-y-2">
                  <Smartphone className="h-12 w-12 text-green-600 mx-auto" />
                  <h4 className="font-semibold">SMS Authentication</h4>
                  <p className="text-sm text-gray-600">
                    Receive verification codes via text message
                  </p>
                </div>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button 
                  onClick={handleStartEnrollment} 
                  disabled={isEnrolling || !phoneNumber} 
                  className="w-full"
                >
                  {isEnrolling ? 'Setting up...' : 'Set up SMS'}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* TOTP Setup */}
        {enrollmentStep === 'setup' && selectedMethod === 'totp' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code with your authenticator app
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Manual Entry Key</label>
              <Input value={secret} readOnly className="font-mono text-xs" />
              <p className="text-xs text-gray-500">
                If you can't scan the QR code, enter this key manually
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={resetEnrollment} variant="outline" className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleVerifyEnrollment} 
                disabled={isEnrolling || verificationCode.length !== 6}
                className="flex-1"
              >
                {isEnrolling ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Phone Verification */}
        {enrollmentStep === 'verify' && selectedMethod === 'phone' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Verify Phone Number</h3>
              <p className="text-gray-600">
                We've sent a verification code to {phoneNumber}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={resetEnrollment} variant="outline" className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleVerifyEnrollment} 
                disabled={isEnrolling || !verificationCode}
                className="flex-1"
              >
                {isEnrolling ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {enrollmentStep === 'select' && (
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            )}
            {mfaStatus?.isEnrolled && (
              <Button onClick={onComplete} className="flex-1">
                Done
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 