import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { factorId } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if MFA is required and this is the last factor
    const { data: preferences } = await supabase
      .from('user_mfa_preferences')
      .select('mfa_required')
      .eq('user_id', user.id)
      .single()

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totalFactors = (factors?.totp?.length || 0) + (factors?.phone?.length || 0)

    if (preferences?.mfa_required && totalFactors <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last MFA method when MFA is required. Disable MFA requirement first.' },
        { status: 400 }
      )
    }

    // Unenroll from MFA
    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('MFA unenrollment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 