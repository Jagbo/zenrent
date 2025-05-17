-- Create token storage tables and functions

-- User tokens table for storing encrypted tokens
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  encrypted_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Add RLS policies to user_tokens table
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow access through our secure functions
CREATE POLICY user_tokens_no_direct_access ON user_tokens
  USING (false);

-- Token audit logs table for tracking token operations
CREATE TABLE IF NOT EXISTS token_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies to token_audit_logs table
ALTER TABLE token_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow access through our secure functions
CREATE POLICY token_audit_logs_no_direct_access ON token_audit_logs
  USING (false);

-- Create function to store encrypted tokens
CREATE OR REPLACE FUNCTION store_encrypted_token(
  p_user_id UUID,
  p_provider VARCHAR,
  p_encrypted_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE,
  p_scope TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
  -- Insert or update the token
  INSERT INTO user_tokens (
    user_id,
    provider,
    encrypted_token,
    expires_at,
    scope,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_provider,
    p_encrypted_token,
    p_expires_at,
    p_scope,
    now(),
    now()
  )
  ON CONFLICT (user_id, provider) DO UPDATE SET
    encrypted_token = p_encrypted_token,
    expires_at = p_expires_at,
    scope = p_scope,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to retrieve encrypted tokens
CREATE OR REPLACE FUNCTION get_encrypted_token(
  p_user_id UUID,
  p_provider VARCHAR
) RETURNS TABLE (
  encrypted_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.encrypted_token,
    t.expires_at,
    t.scope
  FROM user_tokens t
  WHERE t.user_id = p_user_id AND t.provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete tokens
CREATE OR REPLACE FUNCTION delete_token(
  p_user_id UUID,
  p_provider VARCHAR
) RETURNS VOID AS $$
BEGIN
  DELETE FROM user_tokens
  WHERE user_id = p_user_id AND provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log token operations
CREATE OR REPLACE FUNCTION log_token_operation(
  p_user_id UUID,
  p_provider VARCHAR,
  p_action VARCHAR,
  p_ip_address VARCHAR DEFAULT 'unknown',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
  INSERT INTO token_audit_logs (
    user_id,
    provider,
    action,
    ip_address,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_provider,
    p_action,
    p_ip_address,
    p_metadata,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get token audit logs
CREATE OR REPLACE FUNCTION get_token_audit_logs(
  p_user_id UUID,
  p_provider VARCHAR,
  p_limit INTEGER DEFAULT 50
) RETURNS SETOF token_audit_logs AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM token_audit_logs
  WHERE user_id = p_user_id AND provider = p_provider
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a token is expired
CREATE OR REPLACE FUNCTION is_token_expired(
  p_user_id UUID,
  p_provider VARCHAR,
  p_buffer_seconds INTEGER DEFAULT 300
) RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM user_tokens
  WHERE user_id = p_user_id AND provider = p_provider;
  
  IF v_expires_at IS NULL THEN
    RETURN TRUE; -- No token found, consider it expired
  END IF;
  
  -- Check if the token is expired with a buffer
  RETURN v_expires_at - (p_buffer_seconds * interval '1 second') < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
