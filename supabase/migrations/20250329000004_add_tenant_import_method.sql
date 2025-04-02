-- Add tenant_import_method to user_profiles table for keeping track of user preferences
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS tenant_import_method TEXT;

-- Update the leases table to ensure all required fields exist
ALTER TABLE leases 
  ADD COLUMN IF NOT EXISTS rent_due_day INTEGER;

ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add specific fields for break clause details if they don't exist
ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS has_break_clause BOOLEAN DEFAULT FALSE;

ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS break_clause_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS break_clause_notice_period INTEGER;

-- Create relationships view for easier querying tenant-property-lease relationships
CREATE OR REPLACE VIEW tenant_property_relationships AS
SELECT 
  t.id AS tenant_id,
  t.name AS tenant_name,
  t.email AS tenant_email,
  t.phone AS tenant_phone,
  p.id AS property_id,
  p.property_code,
  p.address AS property_address,
  l.id AS lease_id,
  l.start_date,
  l.end_date,
  l.rent_amount,
  l.rent_frequency,
  l.deposit_amount,
  pu.id AS unit_id,
  pu.unit_number
FROM 
  tenants t
JOIN 
  leases l ON t.id = l.tenant_id
LEFT JOIN 
  properties p ON p.property_code = l.property_id
LEFT JOIN 
  property_units pu ON pu.id = l.unit_id
WHERE 
  l.status = 'active';

-- Create a function to import a tenant
CREATE OR REPLACE FUNCTION import_tenant(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_property_id UUID,
  p_unit_id UUID,
  p_rent_amount DECIMAL,
  p_start_date DATE,
  p_end_date DATE,
  p_deposit_amount DECIMAL,
  p_deposit_scheme TEXT
) RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_lease_id UUID;
BEGIN
  -- Insert tenant
  INSERT INTO tenants (
    id, user_id, name, email, phone, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2', p_name, p_email, p_phone, 'active', NOW(), NOW()
  ) RETURNING id INTO v_tenant_id;

  -- Create lease
  INSERT INTO leases (
    id,
    tenant_id,
    property_uuid,
    property_unit_id,
    rent_amount,
    start_date,
    end_date,
    deposit_amount,
    deposit_scheme,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    p_property_id,
    p_unit_id,
    p_rent_amount,
    p_start_date,
    p_end_date,
    p_deposit_amount,
    p_deposit_scheme,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_lease_id;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql; 