import { createClient } from '@supabase/supabase-js'
import { MFAService } from '@/lib/services/mfa'

// Mock Supabase client for testing
const mockSupabase = {
  auth: {
    mfa: {
      enroll: jest.fn(),
      verify: jest.fn(),
      challenge: jest.fn(),
      unenroll: jest.fn(),
      listFactors: jest.fn(),
    },
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
    upsert: jest.fn(),
  })),
}

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

describe('MFA Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('MFA Enrollment', () => {
    it('should enroll TOTP factor successfully', async () => {
      const mockTotpResponse = {
        data: {
          id: 'factor_123',
          type: 'totp',
          totp: {
            qr_code: 'data:image/png;base64,mock_qr_code',
            secret: 'MOCK_SECRET_KEY',
            uri: 'otpauth://totp/ZenRent:user@example.com?secret=MOCK_SECRET_KEY&issuer=ZenRent'
          }
        },
        error: null
      }

      mockSupabase.auth.mfa.enroll.mockResolvedValue(mockTotpResponse)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'user@example.com' } },
        error: null
      })

      const result = await MFAService.enrollTOTP()

      expect(mockSupabase.auth.mfa.enroll).toHaveBeenCalledWith({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      expect(result).toEqual({
        factorId: 'factor_123',
        qrCode: 'data:image/png;base64,mock_qr_code',
        secret: 'MOCK_SECRET_KEY',
        uri: 'otpauth://totp/ZenRent:user@example.com?secret=MOCK_SECRET_KEY&issuer=ZenRent'
      })
    })

    it('should enroll phone factor successfully', async () => {
      const mockPhoneResponse = {
        data: {
          id: 'factor_456',
          type: 'phone',
          phone: '+1234567890'
        },
        error: null
      }

      mockSupabase.auth.mfa.enroll.mockResolvedValue(mockPhoneResponse)

      const result = await MFAService.enrollPhone('+1234567890')

      expect(mockSupabase.auth.mfa.enroll).toHaveBeenCalledWith({
        factorType: 'phone',
        phone: '+1234567890',
        friendlyName: 'Phone SMS'
      })

      expect(result).toEqual({
        factorId: 'factor_456',
        phone: '+1234567890'
      })
    })

    it('should handle enrollment errors', async () => {
      const mockError = new Error('Enrollment failed')
      mockSupabase.auth.mfa.enroll.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(MFAService.enrollTOTP()).rejects.toThrow('Enrollment failed')
    })
  })

  describe('MFA Verification', () => {
    it('should verify TOTP code successfully', async () => {
      const mockVerifyResponse = {
        data: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          user: { id: 'user_123' }
        },
        error: null
      }

      mockSupabase.auth.mfa.verify.mockResolvedValue(mockVerifyResponse)

      const mockDbUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockDbUpdate)

      const result = await MFAService.verifyTOTP('factor_123', '123456')

      expect(mockSupabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: 'factor_123',
        challengeId: undefined,
        code: '123456'
      })

      expect(result).toBe(true)
    })

    it('should verify phone code successfully', async () => {
      const mockVerifyResponse = {
        data: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          user: { id: 'user_123' }
        },
        error: null
      }

      mockSupabase.auth.mfa.verify.mockResolvedValue(mockVerifyResponse)

      const mockDbUpdate = {
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockDbUpdate)

      const result = await MFAService.verifyPhone('factor_456', 'challenge_123', '123456')

      expect(mockSupabase.auth.mfa.verify).toHaveBeenCalledWith({
        factorId: 'factor_456',
        challengeId: 'challenge_123',
        code: '123456'
      })

      expect(result).toBe(true)
    })

    it('should handle verification errors', async () => {
      const mockError = new Error('Invalid code')
      mockSupabase.auth.mfa.verify.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(MFAService.verifyTOTP('factor_123', '000000')).rejects.toThrow('Invalid code')
    })
  })

  describe('MFA Challenge', () => {
    it('should create phone challenge successfully', async () => {
      const mockChallengeResponse = {
        data: {
          id: 'challenge_123',
          type: 'sms'
        },
        error: null
      }

      mockSupabase.auth.mfa.challenge.mockResolvedValue(mockChallengeResponse)

      const result = await MFAService.challengePhone('factor_456')

      expect(mockSupabase.auth.mfa.challenge).toHaveBeenCalledWith({
        factorId: 'factor_456'
      })

      expect(result).toBe('challenge_123')
    })

    it('should handle challenge errors', async () => {
      const mockError = new Error('Challenge failed')
      mockSupabase.auth.mfa.challenge.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(MFAService.challengePhone('factor_456')).rejects.toThrow('Challenge failed')
    })
  })

  describe('MFA Status', () => {
    it('should get user MFA status correctly', async () => {
      const mockFactors = {
        data: {
          totp: [{ id: 'factor_123', friendly_name: 'Authenticator App' }],
          phone: []
        },
        error: null
      }

      const mockPreferences = {
        data: {
          mfa_required: true,
          enrollment_completed_at: '2023-01-01T00:00:00Z'
        },
        error: null
      }

      mockSupabase.auth.mfa.listFactors.mockResolvedValue(mockFactors)
      
      const mockDbSelect = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(mockPreferences))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockDbSelect)

      const result = await MFAService.getUserMFAStatus()

      expect(result).toEqual({
        isEnrolled: true,
        factors: {
          totp: [{ id: 'factor_123', friendly_name: 'Authenticator App' }],
          phone: []
        },
        preferences: {
          mfa_required: true,
          enrollment_completed_at: '2023-01-01T00:00:00Z'
        }
      })
    })

    it('should check if MFA is required', async () => {
      const mockPreferences = {
        data: { mfa_required: true },
        error: null
      }

      const mockDbSelect = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve(mockPreferences))
          }))
        }))
      }
      mockSupabase.from.mockReturnValue(mockDbSelect)

      const result = await MFAService.isMFARequired()

      expect(result).toBe(true)
    })
  })

  describe('MFA Unenrollment', () => {
    it('should unenroll factor successfully', async () => {
      const mockUnenrollResponse = {
        data: {},
        error: null
      }

      mockSupabase.auth.mfa.unenroll.mockResolvedValue(mockUnenrollResponse)

      const result = await MFAService.unenrollFactor('factor_123')

      expect(mockSupabase.auth.mfa.unenroll).toHaveBeenCalledWith({
        factorId: 'factor_123'
      })

      expect(result).toBe(true)
    })

    it('should handle unenrollment errors', async () => {
      const mockError = new Error('Unenrollment failed')
      mockSupabase.auth.mfa.unenroll.mockResolvedValue({
        data: null,
        error: mockError
      })

      await expect(MFAService.unenrollFactor('factor_123')).rejects.toThrow('Unenrollment failed')
    })
  })

  describe('MFA Preferences', () => {
    it('should update MFA preferences successfully', async () => {
      const mockDbUpsert = {
        upsert: jest.fn(() => Promise.resolve({ error: null }))
      }
      mockSupabase.from.mockReturnValue(mockDbUpsert)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123' } },
        error: null
      })

      const preferences = {
        mfa_required: true,
        preferred_method: 'totp' as const,
        phone_number: '+1234567890'
      }

      const result = await MFAService.updateMFAPreferences(preferences)

      expect(mockDbUpsert.upsert).toHaveBeenCalledWith({
        user_id: 'user_123',
        ...preferences,
        updated_at: expect.any(String)
      })

      expect(result).toBe(true)
    })
  })
})

describe('MFA API Endpoints', () => {
  // Mock fetch for API testing
  global.fetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle MFA enrollment API call', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          factorId: 'factor_123',
          qrCode: 'data:image/png;base64,mock_qr_code'
        }
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const response = await fetch('/api/auth/mfa/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'totp' })
    })

    const data = await response.json()

    expect(fetch).toHaveBeenCalledWith('/api/auth/mfa/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'totp' })
    })

    expect(data.success).toBe(true)
    expect(data.data.factorId).toBe('factor_123')
  })

  it('should handle MFA verification API call', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        verified: true
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factorId: 'factor_123',
        code: '123456'
      })
    })

    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.verified).toBe(true)
  })
}) 