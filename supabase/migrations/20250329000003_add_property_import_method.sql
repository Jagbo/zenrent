-- Add property_import_method field to user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS property_import_method TEXT;

-- We'll also ensure we have the metadata field for extended property details
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- If the properties table doesn't exist, create it with all the required fields
CREATE OR REPLACE FUNCTION create_properties_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'properties') THEN
    CREATE TABLE properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      property_code TEXT NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      postcode VARCHAR(10) NOT NULL,
      property_type VARCHAR(50) NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      is_furnished BOOLEAN,
      purchase_date DATE,
      purchase_price NUMERIC,
      current_valuation NUMERIC,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      photo_url TEXT,
      energy_rating VARCHAR(5),
      council_tax_band VARCHAR(3),
      has_garden BOOLEAN,
      has_parking BOOLEAN,
      gas_safety_expiry DATE,
      electrical_safety_expiry DATE,
      notes TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    -- Add indexes
    CREATE INDEX idx_properties_user_id ON properties(user_id);
    CREATE INDEX idx_properties_property_code ON properties(property_code);
    
    -- Create trigger for updated_at
    CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
    
    -- Enable Row Level Security
    ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own properties"
      ON properties
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own properties"
      ON properties
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own properties"
      ON properties
      FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own properties"
      ON properties
      FOR DELETE
      USING (auth.uid() = user_id);
    
    -- In development mode, allow the test user to access all properties
    CREATE POLICY "Test user can access all properties in development"
      ON properties
      USING (
        user_id = '00000000-0000-0000-0000-000000000001' OR 
        auth.uid() = '00000000-0000-0000-0000-000000000001'
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 