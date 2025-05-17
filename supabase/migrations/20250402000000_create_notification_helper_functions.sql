-- Create helper functions for notifications

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_payment_received_notification;
DROP FUNCTION IF EXISTS create_upcoming_rent_due_notification;
DROP FUNCTION IF EXISTS create_maintenance_issue_notification;
DROP FUNCTION IF EXISTS create_lease_expiring_notification;

-- Function to create a payment received notification
CREATE OR REPLACE FUNCTION create_payment_received_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_tenant_name TEXT,
  p_tenant_email TEXT,
  p_tenant_phone TEXT,
  p_property_id UUID,
  p_property_address TEXT,
  p_unit_id UUID,
  p_amount DECIMAL,
  p_payment_id UUID,
  p_payment_date TIMESTAMPTZ,
  p_payment_method TEXT,
  p_reference TEXT,
  p_transaction_id UUID
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  notification_type_id INTEGER;
BEGIN
  -- Get notification type ID
  SELECT id INTO notification_type_id FROM notification_types 
  WHERE name = 'payment_received';

  -- Insert base notification
  INSERT INTO notifications (
    user_id,
    notification_type_id,
    title,
    message,
    is_read,
    priority,
    trigger_event_id
  ) VALUES (
    p_user_id,
    notification_type_id,
    'Payment Received',
    format('Payment of £%s received from %s for %s', p_amount::TEXT, p_tenant_name, p_property_address),
    FALSE,
    'normal',
    p_payment_id
  ) RETURNING id INTO notification_id;

  -- Insert payment notification details
  INSERT INTO rent_payment_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    unit_id,
    payment_amount,
    payment_id,
    payment_date,
    payment_method,
    transaction_reference,
    bank_account_id
  ) VALUES (
    notification_id,
    p_tenant_id,
    p_tenant_name,
    p_tenant_email,
    p_tenant_phone,
    p_property_id,
    p_property_address,
    p_unit_id,
    p_amount,
    p_payment_id,
    p_payment_date,
    p_payment_method,
    p_reference,
    p_transaction_id
  );

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create an upcoming rent due notification
CREATE OR REPLACE FUNCTION create_upcoming_rent_due_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_tenant_name TEXT,
  p_tenant_email TEXT,
  p_tenant_phone TEXT,
  p_property_id UUID,
  p_property_address TEXT,
  p_unit_id UUID,
  p_amount DECIMAL,
  p_due_date TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  notification_type_id INTEGER;
BEGIN
  -- Get notification type ID
  SELECT id INTO notification_type_id FROM notification_types 
  WHERE name = 'upcoming_rent_due';

  -- Insert base notification
  INSERT INTO notifications (
    user_id,
    notification_type_id,
    title,
    message,
    is_read,
    priority
  ) VALUES (
    p_user_id,
    notification_type_id,
    'Upcoming Rent Due',
    format('Rent payment of £%s due from %s for %s on %s', 
           p_amount::TEXT, 
           p_tenant_name, 
           p_property_address,
           to_char(p_due_date, 'DD Mon YYYY')),
    FALSE,
    'high'
  ) RETURNING id INTO notification_id;

  -- Insert rent due notification details
  INSERT INTO rent_payment_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    unit_id,
    payment_amount,
    due_date
  ) VALUES (
    notification_id,
    p_tenant_id,
    p_tenant_name,
    p_tenant_email,
    p_tenant_phone,
    p_property_id,
    p_property_address,
    p_unit_id,
    p_amount,
    p_due_date
  );

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a maintenance issue notification
CREATE OR REPLACE FUNCTION create_maintenance_issue_notification(
  p_user_id UUID,
  p_property_id UUID,
  p_property_address TEXT,
  p_unit_id UUID,
  p_issue_title TEXT,
  p_issue_description TEXT,
  p_priority TEXT,
  p_tenant_id UUID,
  p_tenant_name TEXT,
  p_tenant_email TEXT,
  p_tenant_phone TEXT
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  notification_type_id INTEGER;
BEGIN
  -- Get notification type ID
  SELECT id INTO notification_type_id FROM notification_types 
  WHERE name = 'new_issue_reported';

  -- Insert base notification
  INSERT INTO notifications (
    user_id,
    notification_type_id,
    title,
    message,
    is_read,
    priority
  ) VALUES (
    p_user_id,
    notification_type_id,
    p_issue_title,
    format('Maintenance issue reported at %s: %s', p_property_address, p_issue_description),
    FALSE,
    p_priority
  ) RETURNING id INTO notification_id;

  -- Insert maintenance notification details
  INSERT INTO maintenance_notifications (
    notification_id,
    property_id,
    property_address,
    unit_id,
    issue_title,
    issue_description,
    priority_level,
    tenant_id,
    tenant_name,
    tenant_contact,
    report_date
  ) VALUES (
    notification_id,
    p_property_id,
    p_property_address,
    p_unit_id,
    p_issue_title,
    p_issue_description,
    p_priority,
    p_tenant_id,
    p_tenant_name,
    p_tenant_email,
    NOW()
  );

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a lease expiring notification
CREATE OR REPLACE FUNCTION create_lease_expiring_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_tenant_name TEXT,
  p_tenant_email TEXT,
  p_tenant_phone TEXT,
  p_lease_id UUID,
  p_property_id UUID,
  p_property_address TEXT,
  p_unit_id UUID,
  p_expiry_date TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  notification_type_id INTEGER;
BEGIN
  -- Get notification type ID
  SELECT id INTO notification_type_id FROM notification_types 
  WHERE name = 'lease_expiry_approaching';

  -- Insert base notification
  INSERT INTO notifications (
    user_id,
    notification_type_id,
    title,
    message,
    is_read,
    priority
  ) VALUES (
    p_user_id,
    notification_type_id,
    'Lease Expiring Soon',
    format('Lease for %s at %s expires on %s', 
           p_tenant_name, 
           p_property_address,
           to_char(p_expiry_date, 'DD Mon YYYY')),
    FALSE,
    'high'
  ) RETURNING id INTO notification_id;

  -- Insert lease expiry notification details
  INSERT INTO tenancy_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    lease_id,
    property_id,
    property_address,
    unit_id,
    expiry_date
  ) VALUES (
    notification_id,
    p_tenant_id,
    p_tenant_name,
    p_tenant_email,
    p_tenant_phone,
    p_lease_id,
    p_property_id,
    p_property_address,
    p_unit_id,
    p_expiry_date
  );

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql; 