import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { STRIPE_CONFIG, getPriceId } from '@/lib/stripe/config';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: STRIPE_CONFIG.apiVersion,
});

export async function POST(request: Request) {
  try {
    const { plan, interval } = await request.json();
    
    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, first_name, last_name')
      .eq('user_id', userSession.user.id)
      .single();
    
    let customerId = profile?.stripe_customer_id;
    
    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userSession.user.email,
        name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : userSession.user.email,
        metadata: {
          user_id: userSession.user.id,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userSession.user.id);
    }

    // Get the price ID from our centralized configuration
    const billingInterval = interval === 'yearly' ? 'annual' : 'monthly';
    const priceId = getPriceId(plan, billingInterval);

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?canceled=true`,
      metadata: {
        user_id: userSession.user.id,
        plan: plan,
        interval: interval,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 },
    );
  }
}
