import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { factorId, challengeId, code } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify MFA code
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeId || '', // challengeId is empty for enrollment verification
      code
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Update user preferences if this is enrollment verification
    if (!challengeId) {
      await supabase
        .from('user_mfa_preferences')
        .upsert({
          user_id: user.id,
          enrollment_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } else {
      // Update last MFA login for challenge verification
      await supabase
        .from('user_mfa_preferences')
        .upsert({
          user_id: user.id,
          last_mfa_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 