-- Create issues management tables
-- This migration creates all tables related to property issues and maintenance management

-- Ensure the trigger_set_timestamp function exists
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create issue categories table
CREATE TABLE issue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  priority_default VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Create property units table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  unit_type VARCHAR(50), -- apartment, studio, room, etc.
  floor INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  rent_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- Create the main issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_id UUID NOT NULL,
  unit_id UUID REFERENCES property_units(id),
  category_id UUID REFERENCES issue_categories(id),
  status VARCHAR(50) NOT NULL DEFAULT 'Todo', -- Todo, In Progress, Backlog, Done
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium', -- Low, Medium, High
  type VARCHAR(50) NOT NULL DEFAULT 'Bug', -- Bug, Documentation, Feature (can be customized)
  reported_by UUID, -- user who reported the issue
  assigned_to UUID, -- user assigned to handle the issue
  tenant_id UUID REFERENCES tenants(id), -- tenant who reported the issue (if applicable)
  reported_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  resolution_date TIMESTAMPTZ,
  resolution_notes TEXT,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create issue media table
CREATE TABLE issue_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- image, document, video
  file_name VARCHAR(255) NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create issue comments table
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID,
  tenant_id UUID REFERENCES tenants(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- if true, only visible to property managers, not tenants
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create issue status history table
CREATE TABLE issue_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create contractors table
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Property owner/manager
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  specialty TEXT[], -- plumbing, electrical, etc.
  hourly_rate DECIMAL(10, 2),
  is_preferred BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create work orders table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  contractor_id UUID REFERENCES contractors(id),
  description TEXT NOT NULL,
  estimated_hours DECIMAL(5, 2),
  estimated_cost DECIMAL(10, 2),
  actual_hours DECIMAL(5, 2),
  actual_cost DECIMAL(10, 2),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Scheduled, In Progress, Completed, Cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create triggers to update the 'updated_at' field
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_property_units') THEN
    CREATE TRIGGER set_updated_at_property_units
    BEFORE UPDATE ON property_units
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END;
$$;

CREATE TRIGGER set_updated_at_issues
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_updated_at_contractors
BEFORE UPDATE ON contractors
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_updated_at_work_orders
BEFORE UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create trigger to track issue status changes
CREATE OR REPLACE FUNCTION track_issue_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO issue_status_history
      (issue_id, previous_status, new_status, changed_by)
    VALUES
      (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issue_status_change_trigger
AFTER UPDATE ON issues
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION track_issue_status_changes();

-- Create view for active issues by property
CREATE OR REPLACE VIEW active_issues_by_property AS
SELECT 
  i.property_id,
  COUNT(i.id) AS total_issues,
  SUM(CASE WHEN i.status != 'Done' THEN 1 ELSE 0 END) AS open_issues,
  SUM(CASE WHEN i.priority = 'High' AND i.status != 'Done' THEN 1 ELSE 0 END) AS high_priority_issues
FROM issues i
GROUP BY i.property_id;

-- Create view for issue details
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
  i.property_id,
  pu.unit_number,
  ic.name AS category_name,
  t.name AS tenant_name,
  t.email AS tenant_email,
  t.phone AS tenant_phone,
  COALESCE(wo.status, 'No Work Order') AS work_order_status,
  i.estimated_cost,
  i.actual_cost
FROM issues i
LEFT JOIN property_units pu ON i.unit_id = pu.id
LEFT JOIN issue_categories ic ON i.category_id = ic.id
LEFT JOIN tenants t ON i.tenant_id = t.id
LEFT JOIN work_orders wo ON i.id = wo.issue_id;

-- Function to get all issues for a property
CREATE OR REPLACE FUNCTION get_property_issues(prop_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  status VARCHAR(50),
  priority VARCHAR(50),
  category VARCHAR(255),
  reported_date TIMESTAMPTZ,
  tenant_name VARCHAR(255),
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

-- Create indexes for performance
CREATE INDEX idx_issues_property_id ON issues(property_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_category_id ON issues(category_id);
CREATE INDEX idx_issues_tenant_id ON issues(tenant_id);
CREATE INDEX idx_work_orders_issue_id ON work_orders(issue_id);
CREATE INDEX idx_property_units_property_id ON property_units(property_id);

-- Add RLS policies for security
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own issues" ON issues;
DROP POLICY IF EXISTS "Users can insert their own issues" ON issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON issues;

-- Create RLS policies for issues using property_code
CREATE POLICY "Users can view their own issues" ON issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = issues.property_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own issues" ON issues
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = issues.property_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own issues" ON issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = issues.property_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own issues" ON issues
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = issues.property_id AND p.user_id = auth.uid()
    )
  );

-- Note: Sample data should be added through the seed file instead of migrations 