import { NextRequest, NextResponse } from 'next/server'
import { trackEvent, identifyUser } from '@/lib/services/posthog'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { distinctId, event, properties, userProperties } = body

    if (!distinctId || !event) {
      return NextResponse.json(
        { error: 'distinctId and event are required' },
        { status: 400 }
      )
    }

    // Track the event
    await trackEvent(distinctId, event, properties)

    // If user properties are provided, identify the user
    if (userProperties) {
      await identifyUser(distinctId, userProperties)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

// Example usage in your frontend:
/*
fetch('/api/analytics/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    distinctId: 'user-123',
    event: 'property_created',
    properties: {
      property_type: 'apartment',
      location: 'London',
      rent_amount: 1500,
    },
    userProperties: {
      email: 'user@example.com',
      plan: 'premium',
      properties_count: 5,
    },
  }),
})
*/ 