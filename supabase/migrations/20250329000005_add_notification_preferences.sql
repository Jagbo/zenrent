-- Add notification_preferences column to user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
    'email', jsonb_build_object(
      'rentPayments', true,
      'rentArrears', true,
      'maintenance', true,
      'documents', true,
      'compliance', true,
      'tenancyExpiry', true,
      'financialSummaries', true
    ),
    'sms', jsonb_build_object(
      'urgentMaintenance', false,
      'rentPayments', false,
      'tenantCommunication', false
    ),
    'app', jsonb_build_object(
      'enabled', true
    )
  );

-- Add setup_completed flag to track onboarding completion
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_completed flag to track overall onboarding completion
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create function to retrieve user notification preferences with defaults
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences JSONB;
  v_defaults JSONB := jsonb_build_object(
    'email', jsonb_build_object(
      'rentPayments', true,
      'rentArrears', true,
      'maintenance', true,
      'documents', true,
      'compliance', true,
      'tenancyExpiry', true,
      'financialSummaries', true
    ),
    'sms', jsonb_build_object(
      'urgentMaintenance', false,
      'rentPayments', false,
      'tenantCommunication', false
    ),
    'app', jsonb_build_object(
      'enabled', true
    )
  );
BEGIN
  -- Get user preferences
  SELECT notification_preferences INTO v_preferences
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- If preferences don't exist, return defaults
  IF v_preferences IS NULL THEN
    RETURN v_defaults;
  END IF;
  
  -- Otherwise return user preferences
  RETURN v_preferences;
END;
$$;

-- Create function to update user notification preferences
CREATE OR REPLACE FUNCTION update_user_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update preferences
  UPDATE user_profiles
  SET 
    notification_preferences = p_preferences,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING notification_preferences INTO v_result;
  
  -- If no row was updated, insert new row
  IF v_result IS NULL THEN
    INSERT INTO user_profiles (
      user_id,
      notification_preferences,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_preferences,
      NOW(),
      NOW()
    )
    RETURNING notification_preferences INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$; 