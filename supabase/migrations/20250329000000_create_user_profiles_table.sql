-- Create the user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  title TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  account_type TEXT,
  agreed_terms BOOLEAN DEFAULT FALSE,
  agreed_privacy BOOLEAN DEFAULT FALSE,
  
  -- Additional profile fields
  profile_photo_url TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  town_city TEXT,
  county TEXT,
  postcode TEXT,
  is_company BOOLEAN DEFAULT FALSE,
  
  -- Company profile fields
  company_name TEXT,
  company_registration_number TEXT,
  vat_number TEXT,
  business_type TEXT,
  company_address_line1 TEXT,
  company_address_line2 TEXT,
  company_town_city TEXT,
  company_county TEXT,
  company_postcode TEXT,
  directors JSONB,
  
  -- Additional metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER set_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for accessing user profiles
CREATE POLICY "Users can view their own profiles"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a stored procedure to create the user_profiles table if it doesn't exist
-- This is used by the client when the table doesn't exist yet
CREATE OR REPLACE FUNCTION create_user_profiles_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(10),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      account_type VARCHAR(20) NOT NULL DEFAULT 'individual',
      agreed_terms BOOLEAN DEFAULT FALSE,
      agreed_privacy BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Add index
    CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
    
    -- Create trigger
    CREATE TRIGGER set_updated_at_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
    
    -- Enable RLS
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own profile"
      ON user_profiles
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own profile"
      ON user_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own profile"
      ON user_profiles
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 