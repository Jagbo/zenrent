-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Property owner/manager (j.agbodo@gmail.com)
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

-- Populate sample properties
INSERT INTO properties (
  id,
  user_id,
  property_code,
  address,
  city,
  postcode,
  property_type,
  bedrooms,
  bathrooms,
  is_furnished,
  status,
  photo_url
) VALUES 
(
  'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'prop_15_crescent_road',
  '15 Crescent Road',
  'London',
  'SW11 5PL',
  'flat',
  2,
  1,
  true,
  'active',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070'
),
(
  'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'prop_42_harley_street',
  '42 Harley Street',
  'London',
  'W1G 8PR',
  'house',
  3,
  2,
  true,
  'active',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070'
),
(
  '7a2e1487-f17b-4ceb-b6d1-56934589025b',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'prop_8_victoria_gardens',
  '8 Victoria Gardens',
  'Manchester',
  'M4 7DJ',
  'flat',
  1,
  1,
  false,
  'active',
  'https://images.unsplash.com/photo-1493809842364-78817add643c?q=80&w=2070'
);

-- Update existing leases to link to the proper property UUIDs
UPDATE leases
SET property_uuid = 'bd8e3211-2403-47ac-9947-7a4842c5a4e3'
WHERE property_id = 'prop_15_crescent_road';

UPDATE leases
SET property_uuid = 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8'
WHERE property_id = 'prop_42_harley_street';

UPDATE leases
SET property_uuid = '7a2e1487-f17b-4ceb-b6d1-56934589025b'
WHERE property_id = 'prop_8_victoria_gardens';

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