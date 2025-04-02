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

-- Note: Sample data should be added through the seed file instead of migrations 