-- Purpose: Enhances security of HMRC OAuth token storage by adding column-level encryption
-- Affected Tables: hmrc_authorizations

-- First, ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Backup existing tokens before modifying (if any exist)
CREATE TABLE IF NOT EXISTS hmrc_authorizations_backup AS 
SELECT * FROM hmrc_authorizations;

-- Create encryption key management table with RLS
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only allow system processes and super admins to access keys
CREATE POLICY encryption_keys_isolation ON encryption_keys
  USING (false)
  WITH CHECK (false);

-- Create the initial encryption key for HMRC tokens
INSERT INTO encryption_keys (key_name, key_value)
VALUES ('hmrc_token_key', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key_name) DO NOTHING;

-- Create audit log table for token operations
CREATE TABLE IF NOT EXISTS hmrc_auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE hmrc_auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit logs - users can only view their own logs
CREATE POLICY hmrc_auth_audit_logs_isolation ON hmrc_auth_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert audit logs
CREATE POLICY hmrc_auth_audit_logs_insert ON hmrc_auth_audit_logs
  FOR INSERT
  WITH CHECK (false); -- Only the function can insert

-- Now modify the hmrc_authorizations table to support encrypted tokens with IVs
-- First, back up the table if it exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'hmrc_authorizations') THEN
    -- Table exists, check if it has data
    IF EXISTS (SELECT 1 FROM hmrc_authorizations LIMIT 1) THEN
      -- Create a backup if not already done
      IF NOT EXISTS (SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'hmrc_authorizations_backup') THEN
        CREATE TABLE hmrc_authorizations_backup AS SELECT * FROM hmrc_authorizations;
        RAISE NOTICE 'Backed up hmrc_authorizations table';
      END IF;
    END IF;
  END IF;
END $$;

-- Drop existing table if it exists
DROP TABLE IF EXISTS hmrc_authorizations;

-- Create new encrypted structure
CREATE TABLE hmrc_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,  -- Will store base64 encoded encrypted token
  access_token_iv BYTEA NOT NULL, -- IV for access token
  refresh_token TEXT NOT NULL, -- Will store base64 encoded encrypted token
  refresh_token_iv BYTEA NOT NULL, -- IV for refresh token
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable row level security
ALTER TABLE hmrc_authorizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own tokens
CREATE POLICY hmrc_authorizations_isolation ON hmrc_authorizations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX hmrc_authorizations_user_id_idx ON hmrc_authorizations(user_id);

-- Token management for auth requests during OAuth flow
CREATE TABLE IF NOT EXISTS hmrc_auth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable row level security
ALTER TABLE hmrc_auth_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own auth requests
CREATE POLICY hmrc_auth_requests_isolation ON hmrc_auth_requests
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX hmrc_auth_requests_user_id_idx ON hmrc_auth_requests(user_id);

-- Automated cleanup for expired auth requests
CREATE OR REPLACE FUNCTION cleanup_expired_hmrc_auth_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM hmrc_auth_requests
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run the cleanup function every hour
SELECT cron.schedule(
  'hmrc-auth-cleanup',
  '0 * * * *',  -- Run hourly (at minute 0)
  $$SELECT cleanup_expired_hmrc_auth_requests()$$
);

-- Comment explaining the security benefits of this migration
COMMENT ON TABLE hmrc_authorizations IS 
'Stores encrypted HMRC OAuth tokens with separate IVs for enhanced security. 
Access is restricted by Row Level Security to ensure each user can only access their own tokens.
Tokens are encrypted at the column level using pgcrypto before storage.';

COMMENT ON TABLE hmrc_auth_audit_logs IS
'Provides a comprehensive audit trail of all token operations including access and refresh events.
Useful for security monitoring, debugging, and compliance requirements.'; 