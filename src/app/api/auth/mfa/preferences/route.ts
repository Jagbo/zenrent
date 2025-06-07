import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user MFA preferences
    const { data: preferences } = await supabase
      .from('user_mfa_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get enrolled MFA factors
    const { data: factors } = await supabase.auth.mfa.listFactors()

    return NextResponse.json({
      success: true,
      preferences: preferences || null,
      factors: {
        totp: factors?.totp || [],
        phone: factors?.phone || []
      }
    })

  } catch (error) {
    console.error('Get MFA preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { mfa_required, preferred_method, phone_number } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If enabling MFA requirement, check if user has enrolled factors
    if (mfa_required) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totalFactors = (factors?.totp?.length || 0) + (factors?.phone?.length || 0)
      
      if (totalFactors === 0) {
        return NextResponse.json(
          { error: 'You must set up at least one MFA method before making it required' },
          { status: 400 }
        )
      }
    }

    // Update user preferences
    const updateData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString()
    }

    if (mfa_required !== undefined) updateData.mfa_required = mfa_required
    if (preferred_method !== undefined) updateData.preferred_method = preferred_method
    if (phone_number !== undefined) updateData.phone_number = phone_number

    const { error } = await supabase
      .from('user_mfa_preferences')
      .upsert(updateData)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update MFA preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 