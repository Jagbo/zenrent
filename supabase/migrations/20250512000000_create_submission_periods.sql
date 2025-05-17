-- Migration: Create submission periods table and extend tax submission model
-- This migration adds the SubmissionPeriod model and extends the tax_submissions table
-- with additional fields required for the HMRC MTD integration.

BEGIN;

-- Create the submission_periods table
CREATE TABLE IF NOT EXISTS submission_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_type TEXT NOT NULL, -- 'quarterly', 'annual'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'accepted', 'rejected'
  due_date DATE NOT NULL,
  tax_year TEXT NOT NULL, -- e.g., "2023-2024"
  period_key TEXT, -- HMRC period identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique periods per user and type
  CONSTRAINT unique_user_period UNIQUE (user_id, start_date, end_date, submission_type)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_submission_periods_user_id ON submission_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_periods_dates ON submission_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_submission_periods_status ON submission_periods(status);
CREATE INDEX IF NOT EXISTS idx_submission_periods_due_date ON submission_periods(due_date);

-- Enable Row Level Security
ALTER TABLE submission_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for submission_periods
CREATE POLICY "Users can view their own submission periods"
  ON submission_periods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submission periods"
  ON submission_periods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submission periods"
  ON submission_periods
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submission periods"
  ON submission_periods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_submission_periods_timestamp
BEFORE UPDATE ON submission_periods
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Extend the tax_submissions table with additional fields
ALTER TABLE tax_submissions
  ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES submission_periods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_type TEXT, -- Redundant with period but useful for queries
  ADD COLUMN IF NOT EXISTS calculation_id TEXT, -- HMRC calculation ID
  ADD COLUMN IF NOT EXISTS calculation_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calculation_data JSONB,
  ADD COLUMN IF NOT EXISTS crystallisation_status TEXT, -- 'not_started', 'in_progress', 'completed'
  ADD COLUMN IF NOT EXISTS crystallisation_timestamp TIMESTAMPTZ;

-- Create index for period_id
CREATE INDEX IF NOT EXISTS idx_tax_submissions_period_id ON tax_submissions(period_id);

-- Add MTD-specific fields to the user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS hmrc_user_id TEXT, -- HMRC's identifier for the user
  ADD COLUMN IF NOT EXISTS mtd_subscription_status TEXT DEFAULT 'not_subscribed', -- 'not_subscribed', 'pending', 'subscribed'
  ADD COLUMN IF NOT EXISTS vat_registration_details JSONB; -- VAT registration information

COMMIT;
