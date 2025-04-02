-- Drop all dependent objects
DROP VIEW IF EXISTS property_tenants CASCADE;
DROP VIEW IF EXISTS property_metrics CASCADE;
DROP VIEW IF EXISTS property_financial_metrics CASCADE;
DROP VIEW IF EXISTS property_performance CASCADE;
DROP VIEW IF EXISTS tenant_metrics CASCADE;
DROP VIEW IF EXISTS lease_metrics CASCADE;
DROP FUNCTION IF EXISTS get_property_tenants CASCADE;
DROP FUNCTION IF EXISTS get_tenant_with_lease CASCADE;

-- Add new UUID column
ALTER TABLE leases ADD COLUMN property_id_new uuid;

-- Copy data to new column using property codes
UPDATE leases l
SET property_id_new = p.id
FROM properties p
WHERE l.property_id = p.property_code;

-- Drop old column and rename new column
ALTER TABLE leases DROP COLUMN property_id CASCADE;
ALTER TABLE leases RENAME COLUMN property_id_new TO property_id;

-- Add foreign key constraint
ALTER TABLE leases
  ADD CONSTRAINT fk_leases_property
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE CASCADE;

-- Recreate the views
CREATE OR REPLACE VIEW property_tenants AS
SELECT 
    p.id as property_id,
    p.property_code,
    p.address,
    p.city,
    p.postcode,
    t.id as tenant_id,
    t.name as tenant_name,
    t.email as tenant_email,
    t.phone as tenant_phone,
    l.id as lease_id,
    l.start_date,
    l.end_date,
    l.status as lease_status
FROM 
    properties p
    LEFT JOIN leases l ON p.id = l.property_id
    LEFT JOIN tenants t ON l.tenant_id = t.id
WHERE 
    l.status = 'active';
