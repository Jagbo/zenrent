-- Purpose: Creates tables for HMRC OAuth error handling, authentication failures tracking, and security monitoring
-- Affected tables: hmrc_error_logs, hmrc_auth_failures, security_events

-- Table to log all HMRC OAuth errors for monitoring and debugging
CREATE TABLE IF NOT EXISTS hmrc_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL, -- Unique ID for error tracing
  error_type TEXT NOT NULL, -- OAuth error type
  error_category TEXT NOT NULL, -- Error category
  message TEXT NOT NULL, -- Technical error message
  details JSONB, -- Additional error details
  recovery_actions TEXT[], -- Possible recovery actions
  status_code INTEGER, -- HTTP status code if applicable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hmrc_error_logs ENABLE ROW LEVEL SECURITY;

-- Standard users can only view their own error logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Allow authenticated select own error logs' 
    AND tablename = 'hmrc_error_logs'
  ) THEN
    CREATE POLICY "Allow authenticated select own error logs"
    ON hmrc_error_logs
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END
$$;

-- Admins can view all error logs (policy to be defined based on admin role in your system)

-- Table to track authentication failures for rate limiting
CREATE TABLE IF NOT EXISTS hmrc_auth_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT, -- IP address if available
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  error_details JSONB -- Optional additional details
);

-- Enable Row Level Security
ALTER TABLE hmrc_auth_failures ENABLE ROW LEVEL SECURITY;

-- Only admins should be able to view auth failures for security reasons
-- Default policy restricts all access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Restrict access to auth failures' 
    AND tablename = 'hmrc_auth_failures'
  ) THEN
    CREATE POLICY "Restrict access to auth failures"
    ON hmrc_auth_failures
    FOR SELECT
    USING (false);
  END IF;
END
$$;

-- Table to log security events for monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- Type of security event
  details JSONB, -- Event details
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  handled BOOLEAN DEFAULT false, -- Whether the event has been handled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  handled_at TIMESTAMPTZ,
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only admins should be able to view security events
-- Default policy restricts all access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Restrict access to security events' 
    AND tablename = 'security_events'
  ) THEN
    CREATE POLICY "Restrict access to security events"
    ON security_events
    FOR SELECT
    USING (false);
  END IF;
END
$$;

-- Function to record an HMRC authentication failure
CREATE OR REPLACE FUNCTION record_hmrc_auth_failure(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_failure_id UUID;
  v_failure_count INTEGER;
  v_time_window TIMESTAMPTZ := NOW() - INTERVAL '10 minutes';
BEGIN
  -- Insert the failure record
  INSERT INTO hmrc_auth_failures (
    user_id,
    ip_address,
    error_details
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_error_details
  )
  RETURNING id INTO v_failure_id;
  
  -- Count recent failures
  SELECT COUNT(*) 
  INTO v_failure_count 
  FROM hmrc_auth_failures
  WHERE user_id = p_user_id
  AND timestamp >= v_time_window;
  
  -- If too many failures, log a security event
  IF v_failure_count >= 5 THEN
    INSERT INTO security_events (
      user_id,
      event_type,
      details,
      severity
    ) VALUES (
      p_user_id,
      'excessive_auth_failures',
      jsonb_build_object(
        'source', 'hmrc_oauth',
        'failure_count', v_failure_count,
        'time_window_minutes', 10,
        'ip_address', p_ip_address
      ),
      CASE 
        WHEN v_failure_count >= 10 THEN 'high'
        WHEN v_failure_count >= 7 THEN 'medium'
        ELSE 'low'
      END
    );
  END IF;
  
  RETURN v_failure_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to record authentication failure: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Create index on hmrc_auth_failures for efficient querying
CREATE INDEX IF NOT EXISTS idx_hmrc_auth_failures_user_timestamp
ON hmrc_auth_failures (user_id, timestamp);

-- Create index on hmrc_error_logs for efficient querying
CREATE INDEX IF NOT EXISTS idx_hmrc_error_logs_user_created
ON hmrc_error_logs (user_id, created_at);

-- Create index on error type for analytics
CREATE INDEX IF NOT EXISTS idx_hmrc_error_logs_error_type
ON hmrc_error_logs (error_type, error_category); 