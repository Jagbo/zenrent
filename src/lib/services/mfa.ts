import { createClient } from '@supabase/supabase-js'
import { AuthMFAEnrollResponse, AuthMFAVerifyResponse, AuthMFAChallengeResponse } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface MFAEnrollmentResult {
  success: boolean
  qrCode?: string
  secret?: string
  factorId?: string
  error?: string
}

export interface MFAVerificationResult {
  success: boolean
  error?: string
}

export interface MFAChallengeResult {
  success: boolean
  challengeId?: string
  error?: string
}

export interface UserMFAStatus {
  isEnrolled: boolean
  factors: Array<{
    id: string
    type: 'totp' | 'phone'
    status: 'verified' | 'unverified'
  }>
  preferences?: {
    mfa_required: boolean
    preferred_method: 'totp' | 'phone'
    phone_number?: string
  }
}

export class MFAService {
  /**
   * Get user's current MFA status and enrolled factors
   */
  static async getUserMFAStatus(): Promise<UserMFAStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Return default status for unauthenticated users instead of throwing
        return {
          isEnrolled: false,
          factors: []
        }
      }

      // Get enrolled MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) {
        throw factorsError
      }

      // Get user preferences from our custom table
      const { data: preferences } = await supabase
        .from('user_mfa_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      return {
        isEnrolled: factors.totp.length > 0 || factors.phone.length > 0,
        factors: [
          ...factors.totp.map(factor => ({
            id: factor.id,
            type: 'totp' as const,
            status: factor.status as 'verified' | 'unverified'
          })),
          ...factors.phone.map(factor => ({
            id: factor.id,
            type: 'phone' as const,
            status: factor.status as 'verified' | 'unverified'
          }))
        ],
        preferences: preferences || undefined
      }
    } catch (error) {
      console.error('Error getting MFA status:', error)
      return {
        isEnrolled: false,
        factors: []
      }
    }
  }

  /**
   * Enroll user in TOTP MFA
   */
  static async enrollTOTP(): Promise<MFAEnrollmentResult> {
    try {
      const { data, error }: AuthMFAEnrollResponse = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.type === 'totp') {
        return {
          success: true,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          factorId: data.id
        }
      } else {
        return { success: false, error: 'Invalid factor type for TOTP enrollment' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Enroll user in Phone MFA
   */
  static async enrollPhone(phoneNumber: string): Promise<MFAEnrollmentResult> {
    try {
      const { data, error }: AuthMFAEnrollResponse = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phoneNumber
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        factorId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Verify MFA enrollment with code
   */
  static async verifyEnrollment(factorId: string, code: string): Promise<MFAVerificationResult> {
    try {
      const { error }: AuthMFAVerifyResponse = await supabase.auth.mfa.verify({
        factorId,
        challengeId: '', // Not needed for enrollment verification
        code
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update user preferences to mark enrollment as completed
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_mfa_preferences')
          .upsert({
            user_id: user.id,
            enrollment_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Challenge MFA factor for login
   */
  static async challengeFactor(factorId: string): Promise<MFAChallengeResult> {
    try {
      const { data, error }: AuthMFAChallengeResponse = await supabase.auth.mfa.challenge({
        factorId
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        challengeId: data.id
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Verify MFA challenge during login
   */
  static async verifyChallenge(factorId: string, challengeId: string, code: string): Promise<MFAVerificationResult> {
    try {
      const { error }: AuthMFAVerifyResponse = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update last MFA login timestamp
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_mfa_preferences')
          .upsert({
            user_id: user.id,
            last_mfa_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Unenroll from MFA factor
   */
  static async unenrollFactor(factorId: string): Promise<MFAVerificationResult> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update user MFA preferences
   */
  static async updateMFAPreferences(preferences: {
    mfa_required?: boolean
    preferred_method?: 'totp' | 'phone'
    phone_number?: string
  }): Promise<MFAVerificationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('user_mfa_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if MFA is required for user
   */
  static async isMFARequired(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data: preferences } = await supabase
        .from('user_mfa_preferences')
        .select('mfa_required')
        .eq('user_id', user.id)
        .single()

      return preferences?.mfa_required || false
    } catch (error) {
      console.error('Error checking MFA requirement:', error)
      return false
    }
  }
} 