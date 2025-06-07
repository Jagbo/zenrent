import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Session } from '@supabase/supabase-js'
import { MFAService } from '@/lib/services/mfa'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  mfaRequired: boolean
  mfaVerified: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    mfaRequired: false,
    mfaVerified: false
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setAuthState(prev => ({ ...prev, loading: false }))
        return
      }

      if (session?.user) {
        await checkMFAStatus(session.user)
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          mfaRequired: false,
          mfaVerified: false
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await checkMFAStatus(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            mfaRequired: false,
            mfaVerified: false
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkMFAStatus = async (user: User) => {
    try {
      const mfaRequired = await MFAService.isMFARequired()
      const mfaStatus = await MFAService.getUserMFAStatus()
      
      // Check if MFA verification is needed
      let mfaVerified = true
      if (mfaRequired && mfaStatus.isEnrolled) {
        // Check if user has completed MFA recently
        const { data: preferences } = await supabase
          .from('user_mfa_preferences')
          .select('last_mfa_login')
          .eq('user_id', user.id)
          .single()

        if (preferences?.last_mfa_login) {
          const lastMfaTime = new Date(preferences.last_mfa_login).getTime()
          const now = new Date().getTime()
          const sessionDuration = 8 * 60 * 60 * 1000 // 8 hours
          mfaVerified = now - lastMfaTime < sessionDuration
        } else {
          mfaVerified = false
        }
      }

      setAuthState({
        user,
        session: await supabase.auth.getSession().then(({ data }) => data.session),
        loading: false,
        mfaRequired,
        mfaVerified
      })

    } catch (error) {
      console.error('Error checking MFA status:', error)
      setAuthState({
        user,
        session: await supabase.auth.getSession().then(({ data }) => data.session),
        loading: false,
        mfaRequired: false,
        mfaVerified: true
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    return data
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      throw error
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    router.push('/login')
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw error
    }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      throw error
    }
  }

  const refreshMFAStatus = async () => {
    if (authState.user) {
      await checkMFAStatus(authState.user)
    }
  }

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshMFAStatus
  }
} 