-- Create table for temporary storage of PKCE code verifiers during OAuth flow
CREATE TABLE IF NOT EXISTS hmrc_auth_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Ensure only one active auth request per user
  CONSTRAINT unique_user_auth_request UNIQUE (user_id)
);

-- Create index for faster lookup by user ID
CREATE INDEX IF NOT EXISTS idx_hmrc_auth_requests_user_id ON hmrc_auth_requests(user_id);

-- Create table for storing HMRC OAuth tokens
CREATE TABLE IF NOT EXISTS hmrc_authorizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one active authorization per user
  CONSTRAINT unique_user_authorization UNIQUE (user_id)
);

-- Create index for faster lookup by user ID
CREATE INDEX IF NOT EXISTS idx_hmrc_authorizations_user_id ON hmrc_authorizations(user_id);

-- Add RLS policies for hmrc_auth_requests
ALTER TABLE hmrc_auth_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY hmrc_auth_requests_select_policy 
  ON hmrc_auth_requests FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_auth_requests_insert_policy 
  ON hmrc_auth_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_auth_requests_update_policy 
  ON hmrc_auth_requests FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_auth_requests_delete_policy 
  ON hmrc_auth_requests FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

-- Add RLS policies for hmrc_authorizations
ALTER TABLE hmrc_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY hmrc_authorizations_select_policy 
  ON hmrc_authorizations FOR SELECT 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_authorizations_insert_policy 
  ON hmrc_authorizations FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_authorizations_update_policy 
  ON hmrc_authorizations FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

CREATE POLICY hmrc_authorizations_delete_policy 
  ON hmrc_authorizations FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = auth.users.id AND auth.users.role = 'admin'
  ));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column on hmrc_authorizations
CREATE TRIGGER update_hmrc_authorizations_updated_at
BEFORE UPDATE ON hmrc_authorizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 