-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Property owner/manager
  property_code TEXT UNIQUE NOT NULL, -- For compatibility with existing data
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postcode VARCHAR(10) NOT NULL,
  property_type VARCHAR(50) NOT NULL, -- e.g., flat, house, HMO
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  is_furnished BOOLEAN DEFAULT false,
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  current_valuation DECIMAL(10, 2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, vacant, renovating, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  photo_url TEXT,
  energy_rating VARCHAR(3),
  council_tax_band VARCHAR(2),
  has_garden BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  gas_safety_expiry DATE,
  electrical_safety_expiry DATE,
  notes TEXT,
  metadata JSONB
);

-- Add indexes
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_property_code ON properties(property_code);

-- Create units table for multi-unit properties (HMOs, apartment buildings)
CREATE TABLE property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_number VARCHAR(20) NOT NULL, -- e.g., "Flat 1", "Room B"
  floor VARCHAR(10),
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  is_furnished BOOLEAN DEFAULT false,
  size_sqm DECIMAL(8, 2),
  rent_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'active', -- active, vacant, renovating, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  metadata JSONB,
  UNIQUE(property_id, unit_number)
);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_properties
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_updated_at_property_units
BEFORE UPDATE ON property_units
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Modify leases table to reference both properties and property_units properly
ALTER TABLE leases 
ADD COLUMN property_uuid UUID REFERENCES properties(id),
ADD COLUMN property_unit_id UUID REFERENCES property_units(id);

-- Create a function to get all tenants for a property
CREATE OR REPLACE FUNCTION get_property_tenants(property_uuid UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR(255),
  tenant_email VARCHAR(255),
  tenant_phone VARCHAR(50),
  lease_id UUID,
  lease_start_date TIMESTAMPTZ,
  lease_end_date TIMESTAMPTZ,
  rent_amount DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.email AS tenant_email,
    t.phone AS tenant_phone,
    l.id AS lease_id,
    l.start_date AS lease_start_date,
    l.end_date AS lease_end_date,
    l.rent_amount
  FROM 
    tenants t
    JOIN leases l ON t.id = l.tenant_id
  WHERE 
    l.property_uuid = property_uuid
    AND l.status = 'active';
END;
$$ LANGUAGE plpgsql; 