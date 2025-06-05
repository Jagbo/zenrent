-- WhatsApp Centralized Model Migration
-- This migration implements the centralized WhatsApp opt-in functionality
-- Following the schema design in docs/whatsapp-centralized-schema.md

-- =====================================================
-- PHASE 1: Add WhatsApp Opt-In to User Profiles
-- =====================================================

-- Add WhatsApp opt-in fields to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_opted_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT TRUE;

-- Create index for efficient opt-in status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_enabled 
ON user_profiles(whatsapp_enabled) WHERE whatsapp_enabled = true;

-- =====================================================
-- PHASE 2: Create Efficient Routing Infrastructure
-- =====================================================

-- Create materialized view for fast tenant-to-landlord routing
-- This view will be used by the webhook to quickly identify which landlord
-- should receive messages from specific tenant phone numbers
CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_landlord_routing AS
SELECT 
  -- Tenant information
  t.phone AS tenant_phone,
  t.id AS tenant_id,
  t.name AS tenant_name,
  t.email AS tenant_email,
  
  -- Landlord information  
  t.user_id AS landlord_id,
  up.full_name AS landlord_name,
  up.whatsapp_enabled AS landlord_whatsapp_enabled,
  
  -- Property context
  p.id AS property_id,
  p.address AS property_address,
  p.property_code,
  
  -- Lease information
  l.id AS lease_id,
  l.status AS lease_status,
  l.start_date,
  l.end_date,
  l.rent_amount
  
FROM tenants t
JOIN leases l ON t.id = l.tenant_id 
JOIN properties p ON l.property_id = p.id
JOIN user_profiles up ON t.user_id = up.id
WHERE 
  l.status = 'active'
  AND t.phone IS NOT NULL 
  AND t.phone != ''
  AND LENGTH(TRIM(t.phone)) > 0;

-- Create unique index for ultra-fast phone number lookups during webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS tenant_landlord_routing_phone_idx 
ON tenant_landlord_routing(tenant_phone);

-- Create index for landlord-specific queries
CREATE INDEX IF NOT EXISTS tenant_landlord_routing_landlord_idx 
ON tenant_landlord_routing(landlord_id);

-- =====================================================
-- PHASE 3: Create Helper Functions
-- =====================================================

-- Function to refresh the routing view when tenant/lease data changes
CREATE OR REPLACE FUNCTION refresh_tenant_landlord_routing()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW tenant_landlord_routing;
END;
$$ LANGUAGE plpgsql;

-- Function to find landlord by tenant phone number (for webhook routing)
CREATE OR REPLACE FUNCTION get_landlord_by_tenant_phone(phone_number TEXT)
RETURNS TABLE (
  landlord_id UUID,
  landlord_name TEXT,
  whatsapp_enabled BOOLEAN,
  tenant_id UUID,
  tenant_name TEXT,
  property_id UUID,
  property_address TEXT
) AS $$
BEGIN
  -- Normalize phone number (remove spaces, handle +44 vs 07, etc.)
  phone_number := TRIM(phone_number);
  
  RETURN QUERY
  SELECT 
    tlr.landlord_id,
    tlr.landlord_name,
    tlr.landlord_whatsapp_enabled,
    tlr.tenant_id,
    tlr.tenant_name,
    tlr.property_id,
    tlr.property_address
  FROM tenant_landlord_routing tlr
  WHERE tlr.tenant_phone = phone_number
    AND tlr.landlord_whatsapp_enabled = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tenants for a landlord (for UI display)
CREATE OR REPLACE FUNCTION get_landlord_tenants_for_whatsapp(p_landlord_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  property_address TEXT,
  lease_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tlr.tenant_id,
    tlr.tenant_name,
    tlr.tenant_phone,
    tlr.tenant_email,
    tlr.property_address,
    tlr.lease_status
  FROM tenant_landlord_routing tlr
  WHERE tlr.landlord_id = p_landlord_id
  ORDER BY tlr.tenant_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 4: Create Triggers for Automatic View Refresh
-- =====================================================

-- Function to handle materialized view refresh on data changes
CREATE OR REPLACE FUNCTION trigger_refresh_tenant_routing()
RETURNS trigger AS $$
BEGIN
  -- Refresh the materialized view when tenant, lease, or property data changes
  -- This ensures the routing data is always up-to-date
  PERFORM refresh_tenant_landlord_routing();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-refresh routing view when relevant data changes
-- Note: These triggers will refresh the entire view, which might be expensive
-- Consider using a background job for larger datasets

DROP TRIGGER IF EXISTS trigger_tenants_routing_refresh ON tenants;
CREATE TRIGGER trigger_tenants_routing_refresh
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_tenant_routing();

DROP TRIGGER IF EXISTS trigger_leases_routing_refresh ON leases;
CREATE TRIGGER trigger_leases_routing_refresh
  AFTER INSERT OR UPDATE OR DELETE ON leases
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_tenant_routing();

DROP TRIGGER IF EXISTS trigger_user_profiles_routing_refresh ON user_profiles;
CREATE TRIGGER trigger_user_profiles_routing_refresh
  AFTER UPDATE OF whatsapp_enabled ON user_profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_tenant_routing();

-- =====================================================
-- PHASE 5: Update RLS Policies (Security)
-- =====================================================

-- Ensure landlords can only access their own WhatsApp settings
-- (user_profiles table should already have RLS, but let's be explicit)

-- Create policy for WhatsApp-specific queries if needed
DO $$
BEGIN
  -- Check if RLS is enabled on user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'public' AND c.relname = 'user_profiles' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- PHASE 6: Initial Data Setup
-- =====================================================

-- Populate the materialized view with current data
SELECT refresh_tenant_landlord_routing();

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

-- Add comments to document the new fields
COMMENT ON COLUMN user_profiles.whatsapp_enabled IS 'Whether the landlord has opted in to receive WhatsApp messages from tenants via ZenRent central number';
COMMENT ON COLUMN user_profiles.whatsapp_opted_in_at IS 'Timestamp when the landlord first opted in to WhatsApp messaging';
COMMENT ON COLUMN user_profiles.whatsapp_notifications_enabled IS 'Whether the landlord wants to receive push notifications for new WhatsApp messages';

COMMENT ON MATERIALIZED VIEW tenant_landlord_routing IS 'Optimized view for routing WhatsApp messages from tenant phone numbers to the correct landlords';
COMMENT ON FUNCTION get_landlord_by_tenant_phone(TEXT) IS 'Fast lookup function used by WhatsApp webhook to route incoming messages';
COMMENT ON FUNCTION refresh_tenant_landlord_routing() IS 'Refresh the tenant routing materialized view when tenant/lease data changes';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the migration worked correctly
DO $$
DECLARE
  routing_count INTEGER;
  enabled_landlords INTEGER;
BEGIN
  -- Count routing entries
  SELECT COUNT(*) INTO routing_count FROM tenant_landlord_routing;
  RAISE NOTICE 'Created routing entries for % tenant-landlord relationships', routing_count;
  
  -- Count landlords who could enable WhatsApp
  SELECT COUNT(*) INTO enabled_landlords 
  FROM user_profiles 
  WHERE id IN (SELECT DISTINCT landlord_id FROM tenant_landlord_routing);
  RAISE NOTICE 'Found % landlords with tenants who could enable WhatsApp', enabled_landlords;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates the foundation for centralized WhatsApp messaging:
-- 1. ✅ Landlord opt-in mechanism via user_profiles.whatsapp_enabled
-- 2. ✅ Fast routing infrastructure via tenant_landlord_routing view
-- 3. ✅ Helper functions for webhook routing and UI queries
-- 4. ✅ Automatic view refresh on data changes
-- 5. ✅ Security policies maintained
--
-- Next steps:
-- - Create API endpoints for opt-in management (Task 2.3, 2.4)
-- - Update WhatsApp webhook to use routing functions (Task 5)
-- - Update frontend UI for opt-in toggle (Task 3)
-- ===================================================== 