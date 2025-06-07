import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { factorType, phone } = await request.json()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Enroll in MFA
    const enrollmentData: any = { factorType }
    if (factorType === 'phone' && phone) {
      enrollmentData.phone = phone
    }

    const { data, error } = await supabase.auth.mfa.enroll(enrollmentData)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Return appropriate data based on factor type
    if (factorType === 'totp') {
      return NextResponse.json({
        success: true,
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret
      })
    } else {
      return NextResponse.json({
        success: true,
        factorId: data.id
      })
    }

  } catch (error) {
    console.error('MFA enrollment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 