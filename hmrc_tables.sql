-- Purpose: Creates tables required for HMRC API integration and tax submission tracking.
-- Affected Tables: hmrc_authorizations, tax_submissions, hmrc_submission_logs

-- Table to store HMRC OAuth 2.0 tokens for users
CREATE TABLE IF NOT EXISTS hmrc_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT, 
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT, -- Store granted scopes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id) -- Assuming one HMRC connection per user
);

-- Enable Row Level Security (RLS)
ALTER TABLE hmrc_authorizations ENABLE ROW LEVEL SECURITY;

-- Policies for hmrc_authorizations:
-- Users can only manage their own authorization records.

-- Policy: Allow authenticated users to select their own authorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Allow authenticated select own authorization' 
    AND tablename = 'hmrc_authorizations'
  ) THEN
    CREATE POLICY "Allow authenticated select own authorization" 
    ON hmrc_authorizations 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Allow authenticated users to insert their own authorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Allow authenticated insert own authorization' 
    AND tablename = 'hmrc_authorizations'
  ) THEN
    CREATE POLICY "Allow authenticated insert own authorization" 
    ON hmrc_authorizations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Allow authenticated users to update their own authorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Allow authenticated update own authorization' 
    AND tablename = 'hmrc_authorizations'
  ) THEN
    CREATE POLICY "Allow authenticated update own authorization" 
    ON hmrc_authorizations 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Allow authenticated users to delete their own authorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies 
    WHERE policyname = 'Allow authenticated delete own authorization' 
    AND tablename = 'hmrc_authorizations'
  ) THEN
    CREATE POLICY "Allow authenticated delete own authorization" 
    ON hmrc_authorizations 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create function to store HMRC tokens that bypasses RLS
CREATE OR REPLACE FUNCTION store_hmrc_tokens(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMPTZ,
  p_scope TEXT DEFAULT 'read:self-assessment write:self-assessment'
) RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try to delete any existing record
  DELETE FROM hmrc_authorizations WHERE user_id = p_user_id;
  
  -- Insert new record
  INSERT INTO hmrc_authorizations (
    user_id,
    access_token,
    refresh_token,
    expires_at,
    scope,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_access_token,
    p_refresh_token,
    p_expires_at,
    p_scope,
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to store HMRC tokens: %', SQLERRM;
    RETURN FALSE;
END;
$$; 