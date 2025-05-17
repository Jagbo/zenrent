import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const { plan, interval } = await request.json();

    // Map our plans to Stripe price IDs
    const priceIds: { [key: string]: { monthly: string; yearly: string } } = {
      essential: {
        monthly: process.env.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID!,
        yearly: process.env.STRIPE_ESSENTIAL_YEARLY_PRICE_ID!,
      },
      standard: {
        monthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID!,
        yearly: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID!,
      },
      professional: {
        monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
        yearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID!,
      },
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceIds[plan][interval],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 },
    );
  }
}
