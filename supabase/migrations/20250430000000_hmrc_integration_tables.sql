-- supabase/migrations/YYYYMMDDHHmmss_hmrc_integration_tables.sql
-- Purpose: Creates tables required for HMRC API integration and tax submission tracking.
-- Affected Tables: hmrc_authorizations, tax_submissions, hmrc_submission_logs

BEGIN;

-- Table to store HMRC OAuth 2.0 tokens for users
CREATE TABLE hmrc_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT, -- Encrypt this in application logic before storing
  refresh_token TEXT, -- Encrypt this in application logic before storing
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
CREATE POLICY "Allow authenticated select own authorization" 
ON hmrc_authorizations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own authorization
CREATE POLICY "Allow authenticated insert own authorization" 
ON hmrc_authorizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own authorization
CREATE POLICY "Allow authenticated update own authorization" 
ON hmrc_authorizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own authorization
CREATE POLICY "Allow authenticated delete own authorization" 
ON hmrc_authorizations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Table to track tax submission status
CREATE TABLE tax_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL, -- e.g., "2023/2024"
  submission_type TEXT NOT NULL, -- e.g., 'SA100', 'SA105'
  submission_id TEXT, -- ID returned by HMRC after successful submission
  status TEXT NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'submitted', 'processing', 'accepted', 'rejected', 'error'
  hmrc_reference TEXT, -- Confirmation reference from HMRC
  submitted_at TIMESTAMPTZ,
  payload JSONB, -- Store the submitted data structure for reference/retry
  error_details JSONB, -- Store any error messages from HMRC
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tax_year, submission_type) -- Ensure only one submission record per user/year/type
);

-- Enable Row Level Security (RLS)
ALTER TABLE tax_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for tax_submissions:
-- Users can manage their own submission records.

-- Policy: Allow authenticated users to select their own submissions
CREATE POLICY "Allow authenticated select own submissions" 
ON tax_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own submissions
CREATE POLICY "Allow authenticated insert own submissions" 
ON tax_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own submissions
CREATE POLICY "Allow authenticated update own submissions" 
ON tax_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own submissions (optional, might be better to update status)
CREATE POLICY "Allow authenticated delete own submissions" 
ON tax_submissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Table for detailed HMRC submission logging (optional but recommended for audit)
CREATE TABLE hmrc_submission_logs (
  id BIGSERIAL PRIMARY KEY,
  submission_id UUID REFERENCES tax_submissions(id) ON DELETE SET NULL, -- Link to the submission record
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL, -- e.g., 'submission_attempt', 'hmrc_response', 'status_update'
  details JSONB, -- Request/response details, error messages
  success BOOLEAN
);

-- Enable Row Level Security (RLS)
ALTER TABLE hmrc_submission_logs ENABLE ROW LEVEL SECURITY;

-- Policies for hmrc_submission_logs:
-- Users can select their own logs. Insertion might be restricted to service roles or specific functions.

-- Policy: Allow authenticated users to select their own logs
CREATE POLICY "Allow authenticated select own submission logs" 
ON hmrc_submission_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE/DELETE policies for logs might be handled by backend service roles 
-- or SECURITY DEFINER functions to ensure integrity, rather than direct user modification.
-- For now, let's allow insert for authenticated users for simplicity during development.

-- Policy: Allow authenticated users to insert their own logs (consider restricting this later)
CREATE POLICY "Allow authenticated insert own submission logs" 
ON hmrc_submission_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- Add indexes for common query patterns
CREATE INDEX idx_hmrc_authorizations_user_id ON hmrc_authorizations(user_id);
CREATE INDEX idx_tax_submissions_user_tax_year ON tax_submissions(user_id, tax_year);
CREATE INDEX idx_hmrc_submission_logs_submission_id ON hmrc_submission_logs(submission_id);
CREATE INDEX idx_hmrc_submission_logs_user_id ON hmrc_submission_logs(user_id);

COMMIT; 