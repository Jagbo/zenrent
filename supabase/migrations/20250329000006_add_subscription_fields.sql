-- Add subscription-related fields to the user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_id ON user_profiles(plan_id);

-- Update existing users to have trial status if they don't have a plan_id set
UPDATE user_profiles 
SET 
  plan_id = 'trial',
  subscription_status = 'trial',
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '30 days'
WHERE plan_id IS NULL OR plan_id = ''; 