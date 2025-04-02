import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  profile_photo_url: string | null
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, user_id, first_name, last_name, profile_photo_url')
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user profile'))
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [supabase])

  return { profile, loading, error }
} 