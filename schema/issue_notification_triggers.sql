-- ZenRent Issue Notification Triggers
-- This file contains triggers and functions for generating notifications
-- based on issue events

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- issue_reported, issue_updated, issue_resolved, etc.
  related_entity_id UUID, -- The ID of the related entity (issue, property, etc.)
  related_entity_type TEXT, -- The type of the related entity (issue, property, etc.)
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to create a new issue notification
CREATE OR REPLACE FUNCTION create_issue_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_entity_id UUID,
  p_related_entity_type TEXT,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, 
    title, 
    message, 
    type, 
    related_entity_id, 
    related_entity_type,
    priority
  ) VALUES (
    p_user_id, 
    p_title, 
    p_message, 
    p_type, 
    p_related_entity_id, 
    p_related_entity_type,
    p_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for when a new issue is reported
CREATE OR REPLACE FUNCTION new_issue_reported_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_name TEXT;
  property_owner UUID;
  tenant_name TEXT;
  priority_text TEXT;
BEGIN
  -- Get related property and owner information
  SELECT p.name, p.user_id INTO property_name, property_owner
  FROM properties p
  WHERE p.id = NEW.property_id;
  
  -- Get tenant name if applicable
  SELECT t.name INTO tenant_name
  FROM tenants t
  WHERE t.id = NEW.tenant_id;
  
  -- Set priority text for notification
  IF NEW.priority = 'High' THEN
    priority_text := 'URGENT: ';
  ELSE
    priority_text := '';
  END IF;
  
  -- Create notification for property owner/manager
  PERFORM create_issue_notification(
    property_owner,
    CASE WHEN NEW.is_emergency THEN 'URGENT: New issue reported' ELSE 'New issue reported' END,
    priority_text || NEW.title || ' reported at ' || property_name || 
    CASE WHEN tenant_name IS NOT NULL THEN ' by ' || tenant_name ELSE '' END,
    'issue_reported',
    NEW.id,
    'issue',
    CASE WHEN NEW.is_emergency OR NEW.priority = 'High' THEN 'urgent' ELSE 'normal' END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new issue reported
CREATE TRIGGER issue_reported_notification_trigger
AFTER INSERT ON issues
FOR EACH ROW
EXECUTE FUNCTION new_issue_reported_notification();

-- Trigger function for when an issue status changes
CREATE OR REPLACE FUNCTION issue_status_changed_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_name TEXT;
  property_owner UUID;
  issue_title TEXT;
BEGIN
  -- Skip if status didn't change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get the issue title
  SELECT i.title INTO issue_title
  FROM issues i
  WHERE i.id = NEW.issue_id;
  
  -- Get related property and owner information
  SELECT p.name, p.user_id INTO property_name, property_owner
  FROM issues i
  JOIN properties p ON i.property_id = p.id
  WHERE i.id = NEW.issue_id;
  
  -- Create notification for property owner/manager
  PERFORM create_issue_notification(
    property_owner,
    'Issue status updated',
    'Issue at ' || property_name || ' updated to ' || NEW.new_status || ': ' || issue_title,
    'issue_status_changed',
    NEW.issue_id,
    'issue',
    'normal'
  );
  
  -- If issue is resolved, create a resolution notification
  IF NEW.new_status = 'Done' THEN
    PERFORM create_issue_notification(
      property_owner,
      'Issue resolved',
      'Issue at ' || property_name || ' has been resolved: ' || issue_title,
      'issue_resolved',
      NEW.issue_id,
      'issue',
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for issue status change
CREATE TRIGGER issue_status_changed_notification_trigger
AFTER INSERT ON issue_status_history
FOR EACH ROW
EXECUTE FUNCTION issue_status_changed_notification();

-- Trigger function for when a work order is scheduled
CREATE OR REPLACE FUNCTION work_order_scheduled_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_name TEXT;
  property_owner UUID;
  issue_title TEXT;
  contractor_name TEXT;
BEGIN
  -- Only trigger for newly scheduled work orders
  IF OLD.scheduled_date IS NOT NULL OR NEW.scheduled_date IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get issue and property information
  SELECT i.title, p.name, p.user_id INTO issue_title, property_name, property_owner
  FROM issues i
  JOIN properties p ON i.property_id = p.id
  WHERE i.id = NEW.issue_id;
  
  -- Get contractor name if applicable
  SELECT c.name INTO contractor_name
  FROM contractors c
  WHERE c.id = NEW.contractor_id;
  
  -- Create notification
  PERFORM create_issue_notification(
    property_owner,
    'Maintenance work scheduled',
    'Maintenance work for ' || issue_title || ' at ' || property_name || 
    ' scheduled for ' || to_char(NEW.scheduled_date, 'DD Mon YYYY HH:MI AM') ||
    CASE WHEN contractor_name IS NOT NULL THEN ' with ' || contractor_name ELSE '' END,
    'work_scheduled',
    NEW.id,
    'work_order',
    'normal'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for work order scheduling
CREATE TRIGGER work_order_scheduled_notification_trigger
AFTER UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION work_order_scheduled_notification();

-- Trigger function for when a quote is received for an issue
CREATE OR REPLACE FUNCTION quote_received_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_name TEXT;
  property_owner UUID;
  issue_title TEXT;
BEGIN
  -- Get issue and property information
  SELECT i.title, p.name, p.user_id INTO issue_title, property_name, property_owner
  FROM issues i
  JOIN properties p ON i.property_id = p.id
  WHERE i.id = NEW.issue_id;
  
  -- Create notification
  PERFORM create_issue_notification(
    property_owner,
    'Quote received for issue',
    'Quote of £' || CAST(NEW.estimated_cost AS TEXT) || ' received for ' || 
    issue_title || ' at ' || property_name,
    'quote_received',
    NEW.id,
    'work_order',
    'normal'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quote received
CREATE TRIGGER quote_received_notification_trigger
AFTER INSERT ON work_orders
FOR EACH ROW
WHEN (NEW.estimated_cost IS NOT NULL)
EXECUTE FUNCTION quote_received_notification();

-- Create indexes for notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_related_entity_id ON notifications(related_entity_id);

-- View to show recent notifications
CREATE OR REPLACE VIEW recent_notifications AS
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.priority,
  n.created_at,
  n.is_read,
  u.full_name AS user_name,
  CASE 
    WHEN n.related_entity_type = 'issue' THEN i.title
    WHEN n.related_entity_type = 'work_order' THEN wo.description
    ELSE NULL
  END AS related_entity_name,
  CASE 
    WHEN n.related_entity_type = 'issue' THEN p.name
    WHEN n.related_entity_type = 'work_order' THEN p2.name
    ELSE NULL
  END AS property_name
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN issues i ON n.related_entity_type = 'issue' AND n.related_entity_id = i.id
LEFT JOIN properties p ON i.property_id = p.id
LEFT JOIN work_orders wo ON n.related_entity_type = 'work_order' AND n.related_entity_id = wo.id
LEFT JOIN issues i2 ON wo.issue_id = i2.id
LEFT JOIN properties p2 ON i2.property_id = p2.id
ORDER BY n.created_at DESC; 