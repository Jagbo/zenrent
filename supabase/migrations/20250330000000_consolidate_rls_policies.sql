-- Consolidate RLS Policies
-- This migration ensures all tables have proper RLS policies

-- Create helper function to check if we're in development mode
CREATE OR REPLACE FUNCTION is_development_mode() RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.environment', true)::text = 'development';
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to set app environment 
CREATE OR REPLACE FUNCTION set_app_environment(env text) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.environment', env, false);
END;
$$ LANGUAGE plpgsql;

-- Properties table policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Test user can access all properties in development" ON properties;

-- Create new policies
CREATE POLICY "Users can view their own properties" ON properties
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own properties" ON properties
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own properties" ON properties
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own properties" ON properties
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Test user can access all properties in development" ON properties
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Property Units
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own property units" ON property_units;
DROP POLICY IF EXISTS "Users can insert their own property units" ON property_units;
DROP POLICY IF EXISTS "Users can update their own property units" ON property_units;
DROP POLICY IF EXISTS "Users can delete their own property units" ON property_units;

-- Create new policies
CREATE POLICY "Users can view their own property units" ON property_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_units.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own property units" ON property_units
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_units.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own property units" ON property_units
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_units.property_id
    AND p.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_units.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own property units" ON property_units
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_units.property_id
    AND p.user_id = auth.uid()
  )
);

-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete their own tenants" ON tenants;
DROP POLICY IF EXISTS "Test user can access all tenant data in development" ON tenants;

-- Create new policies
CREATE POLICY "Users can view their own tenants" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM leases l
    JOIN properties p ON l.property_uuid = p.id
    WHERE l.tenant_id = tenants.id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own tenants" ON tenants
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own tenants" ON tenants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM leases l
    JOIN properties p ON l.property_uuid = p.id
    WHERE l.tenant_id = tenants.id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own tenants" ON tenants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM leases l
    JOIN properties p ON l.property_uuid = p.id
    WHERE l.tenant_id = tenants.id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Test user can access all tenant data in development" ON tenants
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Leases
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own leases" ON leases;
DROP POLICY IF EXISTS "Users can insert their own leases" ON leases;
DROP POLICY IF EXISTS "Users can update their own leases" ON leases;
DROP POLICY IF EXISTS "Users can delete their own leases" ON leases;
DROP POLICY IF EXISTS "Test user can access all lease data in development" ON leases;

-- Create new policies
CREATE POLICY "Users can view their own leases" ON leases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = leases.property_uuid
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own leases" ON leases
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = leases.property_uuid
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own leases" ON leases
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = leases.property_uuid
    AND p.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = leases.property_uuid
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own leases" ON leases
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = leases.property_uuid
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Test user can access all lease data in development" ON leases
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Tenant Documents
ALTER TABLE tenant_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their tenant documents" ON tenant_documents;
DROP POLICY IF EXISTS "Users can insert tenant documents" ON tenant_documents;
DROP POLICY IF EXISTS "Users can update tenant documents" ON tenant_documents;
DROP POLICY IF EXISTS "Users can delete tenant documents" ON tenant_documents;

-- Create new policies
CREATE POLICY "Users can view their tenant documents" ON tenant_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_documents.tenant_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tenant documents" ON tenant_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_documents.tenant_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tenant documents" ON tenant_documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_documents.tenant_id
    AND p.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_documents.tenant_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tenant documents" ON tenant_documents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_documents.tenant_id
    AND p.user_id = auth.uid()
  )
);

-- Tenant Histories
ALTER TABLE tenant_histories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tenant histories" ON tenant_histories;
DROP POLICY IF EXISTS "Users can insert tenant histories" ON tenant_histories;

-- Create new policies
CREATE POLICY "Users can view tenant histories" ON tenant_histories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_histories.tenant_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tenant histories" ON tenant_histories
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN leases l ON t.id = l.tenant_id
    JOIN properties p ON l.property_uuid = p.id
    WHERE t.id = tenant_histories.tenant_id
    AND p.user_id = auth.uid()
  )
);

-- Bank Connections
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can insert their own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can update their own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can delete their own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Test user can access all bank connections in development" ON bank_connections;

-- Create new policies
CREATE POLICY "Users can view their own bank connections" ON bank_connections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_connections.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own bank connections" ON bank_connections
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_connections.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own bank connections" ON bank_connections
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_connections.property_id
    AND p.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_connections.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own bank connections" ON bank_connections
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_connections.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Test user can access all bank connections in development" ON bank_connections
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Bank Transactions
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Test user can access all bank transactions in development" ON bank_transactions;

-- Create new policies
CREATE POLICY "Users can view their own bank transactions" ON bank_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.property_code = bank_transactions.property_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Test user can access all bank transactions in development" ON bank_transactions
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Test user can access all notifications in development" ON notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Test user can access all notifications in development" ON notifications
USING (auth.uid() = '00000000-0000-0000-0000-000000000001' AND is_development_mode());

-- Notification Types
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view notification types" ON notification_types;

-- Create new policies
CREATE POLICY "Authenticated users can view notification types" ON notification_types
FOR SELECT USING (auth.role() = 'authenticated');

-- Specialized Notification Tables
DO $$
DECLARE
    notification_tables text[] := ARRAY[
        'rent_payment_notifications', 
        'maintenance_notifications',
        'financial_notifications',
        'tenancy_notifications',
        'compliance_notifications',
        'property_performance_notifications'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY notification_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t) THEN
            EXECUTE 'ALTER TABLE ' || t || ' ENABLE ROW LEVEL SECURITY';
            
            -- Drop existing policy if it exists
            EXECUTE 'DROP POLICY IF EXISTS "Users can view their own ' || t || '" ON ' || t;
            
            -- Create the policy
            EXECUTE '
            CREATE POLICY "Users can view their own ' || t || '" ON ' || t || '
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.id = ' || t || '.notification_id
                AND n.user_id = auth.uid()
              )
            )';
        END IF;
    END LOOP;
END$$;

-- Financial Tables
DO $$
DECLARE
    financial_tables text[] := ARRAY[
        'expenses', 
        'income',
        'financial_metrics',
        'service_charges',
        'invoices'
    ];
    property_link_condition text := 'EXISTS (SELECT 1 FROM properties p WHERE p.id = %s.property_id AND p.user_id = auth.uid())';
    t text;
BEGIN
    FOREACH t IN ARRAY financial_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t) THEN
            EXECUTE 'ALTER TABLE ' || t || ' ENABLE ROW LEVEL SECURITY';
            
            -- Drop existing policy if it exists
            EXECUTE 'DROP POLICY IF EXISTS "Users can view their own ' || t || '" ON ' || t;
            
            -- Create the policy with property link
            EXECUTE format('
            CREATE POLICY "Users can view their own ' || t || '" ON ' || t || '
            FOR SELECT USING (
              %s
            )', format(property_link_condition, t));
        END IF;
    END LOOP;
END$$;

-- Add documentation about RLS to the database
COMMENT ON SCHEMA public IS 'All tables in this schema have Row Level Security (RLS) enabled.
- Most tables use user_id = auth.uid() directly or through property ownership.
- Properties are the foundation table, with user_id directly linked.
- Other tables link to properties for access control.
- Test user (00000000-0000-0000-0000-000000000001) has special access in development mode.';