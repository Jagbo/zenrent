-- Create centralized tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Property owner/manager
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, former, prospective
  date_of_birth DATE,
  national_insurance_number VARCHAR(50), -- For UK tenants
  employment_status VARCHAR(100),
  income_verification TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_reliability_score DECIMAL(5, 2),
  photo_url TEXT,
  notes TEXT,
  referencing_status VARCHAR(50),
  credit_check_status VARCHAR(50),
  metadata JSONB
);

-- Create leases table to connect tenants with properties
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id TEXT NOT NULL, -- Changed from UUID to TEXT to match bank_connections
  unit_id UUID,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  rent_amount DECIMAL(10, 2) NOT NULL,
  rent_frequency VARCHAR(50) NOT NULL DEFAULT 'monthly',
  deposit_amount DECIMAL(10, 2),
  deposit_protection_scheme VARCHAR(100),
  deposit_protection_id VARCHAR(100),
  deposit_protected_on TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, terminated
  lease_document_url TEXT,
  special_conditions TEXT,
  renewal_offered BOOLEAN DEFAULT FALSE,
  renewal_offered_date TIMESTAMPTZ,
  renewal_status VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tenant history table for tracking interactions
CREATE TABLE tenant_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type VARCHAR(100) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  user_id UUID, -- User who created the entry
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tenant documents table
CREATE TABLE tenant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID,
  description TEXT,
  metadata JSONB
);

-- Add indexes for performance
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_tenants_name ON tenants(name);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date);
CREATE INDEX idx_tenant_histories_tenant_id ON tenant_histories(tenant_id);
CREATE INDEX idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);

-- Create trigger to update the 'updated_at' field
CREATE TRIGGER set_updated_at_tenants
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_updated_at_leases
BEFORE UPDATE ON leases
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Update rent_payment_notifications to reference tenants and leases tables
ALTER TABLE rent_payment_notifications
ADD COLUMN centralized_tenant_id UUID REFERENCES tenants(id),
ADD COLUMN centralized_lease_id UUID REFERENCES leases(id);

-- Update maintenance_notifications to reference tenants table
ALTER TABLE maintenance_notifications
ADD COLUMN centralized_tenant_id UUID REFERENCES tenants(id);

-- Update tenancy_notifications to reference tenants and leases tables
ALTER TABLE tenancy_notifications
ADD COLUMN centralized_tenant_id UUID REFERENCES tenants(id),
ADD COLUMN centralized_lease_id UUID REFERENCES leases(id);

-- Populate sample tenant data
INSERT INTO tenants (
  id,
  user_id,
  name,
  email,
  phone,
  status,
  payment_reliability_score,
  photo_url,
  notes
) VALUES 
(
  'e0de8dae-9008-4f45-b912-a87a8c186c30',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'Sarah Johnson',
  'sarah.j@example.co.uk',
  '07700 900456',
  'active',
  95.5,
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'Excellent tenant who always pays on time.'
),
(
  '5f4a39d9-d92d-4fca-bba3-7e34b354fc0d',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'Emma Clarke',
  'emma.c@example.co.uk',
  '07700 900789',
  'active',
  88.0,
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'Generally good tenant, occasional late payments.'
),
(
  'c5bdc148-c9e3-4c4f-a9e7-18462b28e53e',
  '00000000-0000-0000-0000-000000000001', -- j.agbodo@gmail.com user
  'David Wilson',
  'david.w@example.co.uk',
  '07700 900234',
  'active',
  92.0,
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'Reliable tenant with good property maintenance.'
);

-- Populate sample lease data
INSERT INTO leases (
  tenant_id,
  property_id,
  start_date,
  end_date,
  rent_amount,
  deposit_amount,
  deposit_protection_scheme,
  status
) VALUES 
(
  'e0de8dae-9008-4f45-b912-a87a8c186c30', -- Sarah Johnson
  'prop_15_crescent_road',
  NOW() - INTERVAL '1 year',
  NOW() + INTERVAL '5 months',
  1200.00,
  1400.00,
  'Deposit Protection Service',
  'active'
),
(
  '5f4a39d9-d92d-4fca-bba3-7e34b354fc0d', -- Emma Clarke
  'prop_42_harley_street',
  NOW() - INTERVAL '8 months',
  NOW() + INTERVAL '4 months',
  1500.00,
  1800.00,
  'MyDeposits',
  'active'
),
(
  'c5bdc148-c9e3-4c4f-a9e7-18462b28e53e', -- David Wilson
  'prop_8_victoria_gardens',
  NOW() - INTERVAL '11 months',
  NOW() + INTERVAL '1 month',
  950.00,
  1100.00,
  'Tenancy Deposit Scheme',
  'active'
);

-- Add some tenant history records
INSERT INTO tenant_histories (
  tenant_id,
  event_type,
  description,
  user_id
) VALUES
(
  'e0de8dae-9008-4f45-b912-a87a8c186c30', -- Sarah Johnson
  'lease_signed',
  'Initial 12-month lease agreement signed',
  '00000000-0000-0000-0000-000000000001'
),
(
  'e0de8dae-9008-4f45-b912-a87a8c186c30', -- Sarah Johnson
  'maintenance_request',
  'Requested repair of kitchen tap',
  '00000000-0000-0000-0000-000000000001'
),
(
  '5f4a39d9-d92d-4fca-bba3-7e34b354fc0d', -- Emma Clarke
  'lease_signed',
  'Initial 12-month lease agreement signed',
  '00000000-0000-0000-0000-000000000001'
),
(
  'c5bdc148-c9e3-4c4f-a9e7-18462b28e53e', -- David Wilson
  'lease_signed',
  'Initial 12-month lease agreement signed',
  '00000000-0000-0000-0000-000000000001'
),
(
  'c5bdc148-c9e3-4c4f-a9e7-18462b28e53e', -- David Wilson
  'renewal_offered',
  'Offered 12-month lease renewal with 3% rent increase',
  '00000000-0000-0000-0000-000000000001'
); 