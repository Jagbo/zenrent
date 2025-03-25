-- ZenRent Database Schema - Issues Module
-- This schema defines tables related to property issues, maintenance requests, and their relationships

-- Users table (reference)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table (reference)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zipCode TEXT,
  property_type TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  bedrooms INTEGER,
  bathrooms INTEGER,
  squareFeet INTEGER,
  rentAmount DECIMAL(10, 2),
  description TEXT,
  amenities TEXT[],
  yearBuilt INTEGER,
  parkingSpots INTEGER,
  units INTEGER DEFAULT 1,
  occupied_units INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id),
  image TEXT,
  property_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property Units table (for multi-unit properties)
CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  unit_type TEXT, -- apartment, studio, room, etc.
  floor INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  squareFeet INTEGER,
  rent_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'available', -- available, occupied, maintenance, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Tenants table (reference)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  image TEXT,
  about TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leases table (reference)
CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES property_units(id),
  rent_amount DECIMAL(10, 2) NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, terminated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Categories
CREATE TABLE IF NOT EXISTS issue_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  priority_default TEXT DEFAULT 'Medium', -- Low, Medium, High
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate default categories
INSERT INTO issue_categories (name, description, priority_default, requires_approval) VALUES
('Plumbing', 'Water leaks, toilet issues, tap problems', 'High', false),
('Electrical', 'Power outages, electrical faults', 'High', true),
('Heating/Cooling', 'HVAC issues, boiler problems', 'Medium', false),
('Structural', 'Wall cracks, ceiling issues', 'High', true),
('Appliance', 'Issues with provided appliances', 'Medium', false),
('Security', 'Door locks, window issues, alarms', 'High', false),
('Pest Control', 'Rodent or insect infestation', 'Medium', false),
('General Maintenance', 'Minor repairs and maintenance', 'Low', false),
('Noise Complaint', 'Excessive noise from neighbors', 'Medium', false),
('Other', 'Miscellaneous issues', 'Medium', false);

-- Issues table (main table)
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES property_units(id),
  category_id UUID REFERENCES issue_categories(id),
  status TEXT NOT NULL DEFAULT 'Todo', -- Todo, In Progress, Backlog, Done
  priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High
  type TEXT NOT NULL DEFAULT 'Bug', -- Bug, Documentation, Feature (can be customized)
  reported_by UUID REFERENCES users(id), -- user who reported the issue
  assigned_to UUID REFERENCES users(id), -- user assigned to handle the issue
  tenant_id UUID REFERENCES tenants(id), -- tenant who reported the issue (if applicable)
  reported_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  resolution_date TIMESTAMPTZ,
  resolution_notes TEXT,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Media (photos, documents related to issues)
CREATE TABLE IF NOT EXISTS issue_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image, document, video
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Comments (communication thread)
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- if true, only visible to property managers, not tenants
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Status History (for tracking changes)
CREATE TABLE IF NOT EXISTS issue_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Contractor/Supplier table (for maintenance work)
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  specialty TEXT[], -- plumbing, electrical, etc.
  hourly_rate DECIMAL(10, 2),
  is_preferred BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders (for tracking maintenance work related to issues)
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  contractor_id UUID REFERENCES contractors(id),
  description TEXT NOT NULL,
  estimated_hours DECIMAL(5, 2),
  estimated_cost DECIMAL(10, 2),
  actual_hours DECIMAL(5, 2),
  actual_cost DECIMAL(10, 2),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Scheduled, In Progress, Completed, Cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views for easier querying

-- Active issues by property
CREATE OR REPLACE VIEW active_issues_by_property AS
SELECT 
  p.id AS property_id,
  p.name AS property_name,
  p.address,
  p.city,
  COUNT(i.id) AS total_issues,
  SUM(CASE WHEN i.status != 'Done' THEN 1 ELSE 0 END) AS open_issues,
  SUM(CASE WHEN i.priority = 'High' AND i.status != 'Done' THEN 1 ELSE 0 END) AS high_priority_issues
FROM properties p
LEFT JOIN issues i ON p.id = i.property_id
GROUP BY p.id, p.name, p.address, p.city;

-- Issue details view with related information
CREATE OR REPLACE VIEW issue_details AS
SELECT 
  i.id,
  i.title,
  i.description,
  i.status,
  i.priority,
  i.type,
  i.reported_date,
  i.due_date,
  i.resolution_date,
  i.is_emergency,
  p.id AS property_id,
  p.name AS property_name,
  p.address AS property_address,
  pu.unit_number,
  ic.name AS category_name,
  t.name AS tenant_name,
  t.email AS tenant_email,
  t.phone AS tenant_phone,
  reporting_user.full_name AS reported_by_name,
  assigned_user.full_name AS assigned_to_name,
  COALESCE(wo.status, 'No Work Order') AS work_order_status,
  i.estimated_cost,
  i.actual_cost
FROM issues i
JOIN properties p ON i.property_id = p.id
LEFT JOIN property_units pu ON i.unit_id = pu.id
LEFT JOIN issue_categories ic ON i.category_id = ic.id
LEFT JOIN tenants t ON i.tenant_id = t.id
LEFT JOIN users reporting_user ON i.reported_by = reporting_user.id
LEFT JOIN users assigned_user ON i.assigned_to = assigned_user.id
LEFT JOIN work_orders wo ON i.id = wo.issue_id;

-- Functions

-- Function to get all issues for a property
CREATE OR REPLACE FUNCTION get_property_issues(prop_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  priority TEXT,
  category TEXT,
  reported_date TIMESTAMPTZ,
  tenant_name TEXT,
  is_emergency BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.status,
    i.priority,
    ic.name AS category,
    i.reported_date,
    t.name AS tenant_name,
    i.is_emergency
  FROM issues i
  LEFT JOIN issue_categories ic ON i.category_id = ic.id
  LEFT JOIN tenants t ON i.tenant_id = t.id
  WHERE i.property_id = prop_id
  ORDER BY 
    i.is_emergency DESC,
    CASE i.priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    i.reported_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_issues_modtime
BEFORE UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_work_orders_modtime
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Trigger to add status history entry when issue status changes
CREATE OR REPLACE FUNCTION track_issue_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO issue_status_history
      (issue_id, previous_status, new_status, changed_by)
    VALUES
      (NEW.id, OLD.status, NEW.status, current_setting('app.current_user_id', true)::UUID);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issue_status_change_trigger
AFTER UPDATE ON issues
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION track_issue_status_changes();

-- Indexes for performance
CREATE INDEX idx_issues_property_id ON issues(property_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_category_id ON issues(category_id);
CREATE INDEX idx_issues_tenant_id ON issues(tenant_id);
CREATE INDEX idx_work_orders_issue_id ON work_orders(issue_id);
CREATE INDEX idx_property_units_property_id ON property_units(property_id); 