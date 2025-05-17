-- Drop the old function if exists
DROP FUNCTION IF EXISTS get_property_tenants;

-- Create the fixed function with qualified column names
CREATE OR REPLACE FUNCTION get_property_tenants(prop_uuid UUID)
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
    l.property_uuid = prop_uuid
    AND l.status = 'active';
END;
$$ LANGUAGE plpgsql; 