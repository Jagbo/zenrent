import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { STRIPE_CONFIG, getPlanIdFromPriceId } from '@/lib/stripe/config';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: STRIPE_CONFIG.apiVersion,
});

const endpointSecret = STRIPE_CONFIG.webhookSecret;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  const planId = getPlanIdFromPriceId(subscription.items.data[0]?.price.id);
  const billingInterval = subscription.items.data[0]?.price.recurring?.interval || 'month';
  
  await updateUserSubscription(supabase, customerId, {
    plan_id: planId,
    subscription_status: subscription.status,
    billing_interval: billingInterval,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    is_trial_active: false, // End trial when subscription is created
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  const planId = getPlanIdFromPriceId(subscription.items.data[0]?.price.id);
  const billingInterval = subscription.items.data[0]?.price.recurring?.interval || 'month';
  
  await updateUserSubscription(supabase, customerId, {
    plan_id: planId,
    subscription_status: subscription.status,
    billing_interval: billingInterval,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    is_trial_active: false,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  const customerId = subscription.customer as string;
  
  await updateUserSubscription(supabase, customerId, {
    plan_id: 'essential', // Downgrade to essential plan
    subscription_status: 'canceled',
    billing_interval: null,
    next_billing_date: null,
    is_trial_active: false,
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  
  // Update subscription status to active if payment succeeded
  await updateUserSubscription(supabase, customerId, {
    subscription_status: 'active',
  });
  
  // Log the successful payment
  console.log(`Payment succeeded for customer ${customerId}, amount: ${invoice.amount_paid}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  const customerId = invoice.customer as string;
  
  // Update subscription status to past_due if payment failed
  await updateUserSubscription(supabase, customerId, {
    subscription_status: 'past_due',
  });
  
  // Log the failed payment
  console.log(`Payment failed for customer ${customerId}, amount: ${invoice.amount_due}`);
}

async function handleCustomerCreated(customer: Stripe.Customer, supabase: any) {
  // This is mainly for logging purposes
  console.log(`New Stripe customer created: ${customer.id}, email: ${customer.email}`);
}

async function updateUserSubscription(supabase: any, stripeCustomerId: string, updates: any) {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId);

  if (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }

  // If the user's plan changed, update their plan recommendation
  if (updates.plan_id || updates.subscription_status) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (userProfile?.user_id) {
      await supabase.rpc('update_user_plan_recommendation', {
        user_uuid: userProfile.user_id
      });
    }
  }
} 