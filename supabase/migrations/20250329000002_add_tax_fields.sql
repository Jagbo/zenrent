-- Add tax-related fields to the user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS tax_status TEXT,
  ADD COLUMN IF NOT EXISTS tax_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS utr TEXT,
  ADD COLUMN IF NOT EXISTS mtd_status TEXT,
  ADD COLUMN IF NOT EXISTS is_uk_tax_resident BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_non_resident_scheme BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accounting_period TEXT; 