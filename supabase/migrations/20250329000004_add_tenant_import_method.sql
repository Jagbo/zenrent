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

-- Create functions to handle tenant creation and linking to properties
CREATE OR REPLACE FUNCTION create_tenant_with_lease(
  p_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_property_code TEXT,
  p_unit_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_rent_amount NUMERIC,
  p_rent_frequency TEXT,
  p_rent_due_day INTEGER,
  p_payment_method TEXT,
  p_deposit_amount NUMERIC,
  p_deposit_scheme TEXT,
  p_deposit_ref TEXT,
  p_deposit_date TIMESTAMP WITH TIME ZONE,
  p_special_conditions TEXT,
  p_has_break_clause BOOLEAN,
  p_break_clause_date TIMESTAMP WITH TIME ZONE,
  p_break_clause_notice INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_lease_id UUID;
  v_result JSONB;
BEGIN
  -- Create tenant
  INSERT INTO tenants (
    id, user_id, name, email, phone, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_name, p_email, p_phone, 'active', NOW(), NOW()
  ) RETURNING id INTO v_tenant_id;
  
  -- Create lease
  INSERT INTO leases (
    id, tenant_id, property_id, unit_id, start_date, end_date, 
    rent_amount, rent_frequency, rent_due_day, payment_method,
    deposit_amount, deposit_protection_scheme, deposit_protection_id, deposit_protected_on,
    special_conditions, has_break_clause, break_clause_date, break_clause_notice_period,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, p_property_code, p_unit_id, p_start_date, p_end_date,
    p_rent_amount, p_rent_frequency, p_rent_due_day, p_payment_method,
    p_deposit_amount, p_deposit_scheme, p_deposit_ref, p_deposit_date,
    p_special_conditions, p_has_break_clause, p_break_clause_date, p_break_clause_notice,
    'active', NOW(), NOW()
  ) RETURNING id INTO v_lease_id;
  
  -- Return the created IDs
  v_result := jsonb_build_object(
    'tenant_id', v_tenant_id,
    'lease_id', v_lease_id
  );
  
  RETURN v_result;
END;
$$; 