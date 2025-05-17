-- Add landlord profile fields to the user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS town_city TEXT,
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  ADD COLUMN IF NOT EXISTS is_company BOOLEAN DEFAULT FALSE,
  
  -- Company profile fields
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS company_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS company_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS company_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS company_town_city TEXT,
  ADD COLUMN IF NOT EXISTS company_county TEXT,
  ADD COLUMN IF NOT EXISTS company_postcode TEXT,
  ADD COLUMN IF NOT EXISTS directors JSONB; 