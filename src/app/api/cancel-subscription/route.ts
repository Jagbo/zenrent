import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json()

    const subscription = await stripe.subscriptions.cancel(subscriptionId)

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error canceling subscription' },
      { status: 500 }
    )
  }
} 