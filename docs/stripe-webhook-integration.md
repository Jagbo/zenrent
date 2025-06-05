# Stripe Webhook Integration Documentation

## Overview

ZenRent uses Stripe webhooks to automatically sync subscription status between Stripe and the application database. This ensures that user subscription states are always up-to-date without requiring manual intervention.

## Architecture

### Key Components

1. **Webhook Endpoint** (`/api/webhooks/stripe`)
   - Receives and validates Stripe webhook events
   - Processes subscription lifecycle events
   - Updates user profiles in the database

2. **Stripe Configuration** (`/lib/stripe/config.ts`)
   - Centralizes all Stripe-related settings
   - Maps price IDs to internal plan IDs
   - Provides helper functions for pricing

3. **Plan Recommendation Service** (`/lib/services/planRecommendationService.ts`)
   - Calculates recommended plans based on property count
   - Tracks trial status
   - Enforces plan limits

## Webhook Events Handled

### 1. `customer.subscription.created`
- Triggered when a new subscription is created
- Updates user's plan, billing interval, and subscription status
- Ends the free trial period
- Sets the next billing date

### 2. `customer.subscription.updated`
- Triggered when subscription details change (plan upgrade/downgrade)
- Updates plan information and billing details
- Recalculates plan recommendations

### 3. `customer.subscription.deleted`
- Triggered when a subscription is cancelled
- Downgrades user to Essential plan
- Sets subscription status to 'canceled'
- Clears billing information

### 4. `invoice.payment_succeeded`
- Triggered on successful payment
- Updates subscription status to 'active'
- Logs payment details

### 5. `invoice.payment_failed`
- Triggered on failed payment
- Updates subscription status to 'past_due'
- Logs failure details

### 6. `customer.created`
- Triggered when a new Stripe customer is created
- Used for logging and tracking

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from your Stripe Dashboard)
STRIPE_ESSENTIAL_MONTHLY_PRICE_ID=price_...
STRIPE_ESSENTIAL_ANNUAL_PRICE_ID=price_...
STRIPE_STANDARD_MONTHLY_PRICE_ID=price_...
STRIPE_STANDARD_ANNUAL_PRICE_ID=price_...
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...
```

### 2. Create Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
5. Copy the webhook signing secret and add it to your environment variables

### 3. Local Development with Stripe CLI

For local testing, use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret displayed and use it for local development
```

## Database Schema

The webhook integration updates the following fields in the `user_profiles` table:

- `plan_id`: Current subscription plan (essential/standard/professional)
- `subscription_status`: Status of the subscription (trial/active/past_due/canceled)
- `billing_interval`: Billing frequency (monthly/annual)
- `next_billing_date`: Next payment date
- `is_trial_active`: Whether user is on free trial
- `stripe_customer_id`: Stripe customer identifier

## Plan Recommendation Logic

The system automatically calculates recommended plans based on:

- **Essential Plan**: 1-2 properties, no HMO support
- **Standard Plan**: 2-10 properties, HMO support
- **Professional Plan**: 10+ properties, HMO support

When properties are added/removed, the system updates the `recommended_plan_id` and sets `plan_upgrade_required` if the user needs to upgrade.

## Testing

### Unit Tests

Run the webhook unit tests:

```bash
npm test -- --testPathPattern=stripe-webhook.test.ts
```

### Integration Testing

1. Use Stripe test mode with test API keys
2. Create test subscriptions using test card numbers
3. Monitor webhook events in Stripe Dashboard
4. Verify database updates match webhook events

### Test Card Numbers

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

## Security Considerations

1. **Webhook Signature Verification**: All incoming webhooks are verified using the Stripe signing secret
2. **HTTPS Only**: Webhooks should only be received over HTTPS in production
3. **Idempotency**: Webhook handlers are designed to be idempotent - processing the same event multiple times won't cause issues
4. **Error Handling**: Failed webhook processing returns appropriate error codes for Stripe retry logic

## Monitoring

1. **Stripe Dashboard**: Monitor webhook delivery and failures
2. **Application Logs**: Check server logs for webhook processing errors
3. **Database Queries**: Verify subscription data is correctly synced

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Verify the webhook secret is correct
   - Ensure raw request body is used for signature verification

2. **User profile not updating**
   - Check if `stripe_customer_id` is set in user profile
   - Verify webhook events are being received
   - Check application logs for errors

3. **Plan recommendations not updating**
   - Ensure database triggers are active
   - Verify `update_user_plan_recommendation` function is called

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=stripe:*
```

This will log all Stripe API calls and webhook events for troubleshooting. 