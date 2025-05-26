-- Create tax_adjustments table
-- This script creates the tax_adjustments table for storing tax adjustment data

-- Create the tax_adjustments table
CREATE TABLE IF NOT EXISTS tax_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,
  use_mileage_allowance BOOLEAN DEFAULT FALSE,
  mileage_total DECIMAL(10,2),
  use_property_income_allowance BOOLEAN DEFAULT FALSE,
  prior_year_losses DECIMAL(10,2),
  capital_allowances DECIMAL(10,2),
  wear_and_tear_allowance DECIMAL(10,2),
  use_wear_and_tear BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique adjustments per user and tax year
  CONSTRAINT unique_user_tax_year_adjustments UNIQUE (user_id, tax_year)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tax_adjustments_user_id ON tax_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_adjustments_tax_year ON tax_adjustments(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_adjustments_user_tax_year ON tax_adjustments(user_id, tax_year);

-- Enable Row Level Security
ALTER TABLE tax_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_adjustments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_adjustments' 
    AND policyname = 'Users can view their own tax adjustments'
  ) THEN
    CREATE POLICY "Users can view their own tax adjustments"
      ON tax_adjustments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_adjustments' 
    AND policyname = 'Users can insert their own tax adjustments'
  ) THEN
    CREATE POLICY "Users can insert their own tax adjustments"
      ON tax_adjustments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_adjustments' 
    AND policyname = 'Users can update their own tax adjustments'
  ) THEN
    CREATE POLICY "Users can update their own tax adjustments"
      ON tax_adjustments
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_adjustments' 
    AND policyname = 'Users can delete their own tax adjustments'
  ) THEN
    CREATE POLICY "Users can delete their own tax adjustments"
      ON tax_adjustments
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'set_tax_adjustments_timestamp'
  ) THEN
    CREATE TRIGGER set_tax_adjustments_timestamp
    BEFORE UPDATE ON tax_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$; 