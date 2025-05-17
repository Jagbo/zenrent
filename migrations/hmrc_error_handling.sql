-- HMRC Error Handling Schema
-- This migration creates tables for error logging, rate limiting, and security monitoring

-- Error logs table to track OAuth errors
CREATE TABLE IF NOT EXISTS hmrc_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_category TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  recovery_actions TEXT[],
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hmrc_error_logs ENABLE ROW LEVEL SECURITY;

-- Admin access policy (can see all logs)
CREATE POLICY hmrc_error_logs_admin ON hmrc_error_logs 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- User access policy (can only see their own logs)
CREATE POLICY hmrc_error_logs_user ON hmrc_error_logs 
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Create index on user_id and error_type for faster queries
CREATE INDEX IF NOT EXISTS hmrc_error_logs_user_id_error_type ON hmrc_error_logs (user_id, error_type);
CREATE INDEX IF NOT EXISTS hmrc_error_logs_created_at ON hmrc_error_logs (created_at DESC);

-- Table to track authentication failures (for rate limiting)
CREATE TABLE IF NOT EXISTS hmrc_auth_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hmrc_auth_failures ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY hmrc_auth_failures_admin ON hmrc_auth_failures 
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Create index for querying recent failures
CREATE INDEX IF NOT EXISTS hmrc_auth_failures_user_id_timestamp ON hmrc_auth_failures (user_id, timestamp DESC);

-- Table for security events (suspicious activity, etc.)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Admin access policy
CREATE POLICY security_events_admin ON security_events 
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS security_events_user_id ON security_events (user_id);
CREATE INDEX IF NOT EXISTS security_events_event_type ON security_events (event_type);
CREATE INDEX IF NOT EXISTS security_events_resolved ON security_events (resolved);
CREATE INDEX IF NOT EXISTS security_events_created_at ON security_events (created_at DESC);

-- Function to record auth failure with IP address
CREATE OR REPLACE FUNCTION record_auth_failure(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO hmrc_auth_failures (user_id, ip_address)
  VALUES (p_user_id, p_ip_address)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Function to get recent auth failures for a user
CREATE OR REPLACE FUNCTION get_recent_auth_failures(
  p_user_id UUID,
  p_minutes INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.ip_address, f.timestamp
  FROM hmrc_auth_failures f
  WHERE f.user_id = p_user_id
  AND f.timestamp >= (NOW() - (p_minutes || ' minutes')::INTERVAL)
  ORDER BY f.timestamp DESC;
END;
$$;

-- Function to flag suspicious activity
CREATE OR REPLACE FUNCTION flag_suspicious_activity(
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details)
  RETURNING id INTO v_id;
  
  -- Here you could add additional logic like sending notifications to admins
  
  RETURN v_id;
END;
$$;

-- Update trigger for logging changes to security events
CREATE OR REPLACE FUNCTION log_security_event_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.resolved = FALSE AND NEW.resolved = TRUE THEN
    NEW.resolved_at = NOW();
    NEW.resolved_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER security_event_resolution
  BEFORE UPDATE ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION log_security_event_changes();

-- Function to resolve a security event
CREATE OR REPLACE FUNCTION resolve_security_event(
  p_event_id UUID,
  p_resolution_details TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  UPDATE security_events
  SET resolved = TRUE,
      resolved_at = NOW(),
      resolved_by = auth.uid(),
      resolution_details = p_resolution_details
  WHERE id = p_event_id
  AND resolved = FALSE;
  
  GET DIAGNOSTICS v_success = ROW_COUNT;
  
  RETURN v_success > 0;
END;
$$; 