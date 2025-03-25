-- Create a general function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  _notification_type TEXT,
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _priority TEXT DEFAULT 'normal',
  _trigger_event_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  _notification_type_id INTEGER;
  _notification_id UUID;
BEGIN
  -- Get notification type ID
  SELECT id INTO _notification_type_id FROM notification_types 
  WHERE name = _notification_type;
  
  IF _notification_type_id IS NULL THEN
    RAISE EXCEPTION 'Invalid notification type: %', _notification_type;
  END IF;
  
  -- Create notification record
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    trigger_event_id, 
    metadata
  ) VALUES (
    _notification_type_id, 
    _user_id, 
    _title, 
    _message, 
    _priority, 
    _trigger_event_id, 
    _metadata
  ) RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a rent payment received notification
CREATE OR REPLACE FUNCTION create_payment_received_notification(
  _user_id UUID,
  _tenant_id UUID,
  _tenant_name TEXT,
  _tenant_email TEXT,
  _tenant_phone TEXT,
  _property_id UUID,
  _property_address TEXT,
  _unit_id UUID,
  _payment_amount DECIMAL,
  _payment_id UUID,
  _payment_date TIMESTAMPTZ,
  _payment_method TEXT,
  _transaction_reference TEXT,
  _bank_account_id UUID
) RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
  _title TEXT;
  _message TEXT;
  _metadata JSONB;
BEGIN
  -- Format title and message
  _title := 'Rent Payment Received';
  _message := format('Rent payment of £%s received from %s for %s', 
                    _payment_amount::text, _tenant_name, _property_address);
  
  -- Create metadata
  _metadata := jsonb_build_object(
    'tenant_id', _tenant_id,
    'property_id', _property_id,
    'payment_id', _payment_id,
    'payment_amount', _payment_amount
  );
  
  -- Create notification
  _notification_id := create_notification(
    'payment_received',
    _user_id,
    _title,
    _message,
    'normal',
    _payment_id,
    _metadata
  );
  
  -- Create rent payment notification record
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
    _notification_id,
    _tenant_id,
    _tenant_name,
    _tenant_email,
    _tenant_phone,
    _property_id,
    _property_address,
    _unit_id,
    _payment_amount,
    _payment_id,
    _payment_date,
    _payment_method,
    _transaction_reference,
    _bank_account_id
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create upcoming rent due notification
CREATE OR REPLACE FUNCTION create_upcoming_rent_due_notification(
  _user_id UUID,
  _tenant_id UUID,
  _tenant_name TEXT,
  _tenant_email TEXT,
  _tenant_phone TEXT,
  _property_id UUID,
  _property_address TEXT,
  _unit_id UUID,
  _amount_due DECIMAL,
  _due_date TIMESTAMPTZ,
  _payment_id UUID,
  _lease_id UUID,
  _payment_period TEXT
) RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
  _title TEXT;
  _message TEXT;
  _metadata JSONB;
BEGIN
  -- Format title and message
  _title := 'Upcoming Rent Due';
  _message := format('Rent of £%s due in 5 days from %s for %s', 
                    _amount_due::text, _tenant_name, _property_address);
  
  -- Create metadata
  _metadata := jsonb_build_object(
    'tenant_id', _tenant_id,
    'property_id', _property_id,
    'due_date', _due_date,
    'amount_due', _amount_due,
    'lease_id', _lease_id
  );
  
  -- Create notification
  _notification_id := create_notification(
    'upcoming_rent_due',
    _user_id,
    _title,
    _message,
    'normal',
    _payment_id,
    _metadata
  );
  
  -- Create rent payment notification record
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
    due_date,
    lease_id,
    payment_period
  ) VALUES (
    _notification_id,
    _tenant_id,
    _tenant_name,
    _tenant_email,
    _tenant_phone,
    _property_id,
    _property_address,
    _unit_id,
    _amount_due,
    _payment_id,
    _due_date,
    _lease_id,
    _payment_period
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create new maintenance issue notification
CREATE OR REPLACE FUNCTION create_new_issue_notification(
  _user_id UUID,
  _property_id UUID,
  _property_address TEXT,
  _unit_id UUID,
  _issue_id UUID,
  _issue_type TEXT,
  _issue_title TEXT,
  _issue_description TEXT,
  _priority_level TEXT,
  _tenant_id UUID,
  _tenant_name TEXT,
  _tenant_contact TEXT,
  _report_date TIMESTAMPTZ,
  _category_id UUID,
  _location_in_property TEXT
) RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
  _title TEXT;
  _message TEXT;
  _metadata JSONB;
BEGIN
  -- Format title and message
  _title := 'New Maintenance Issue';
  _message := format('New %s issue reported at %s: %s', 
                    _priority_level, _property_address, _issue_title);
  
  -- Create metadata
  _metadata := jsonb_build_object(
    'property_id', _property_id,
    'issue_id', _issue_id,
    'priority_level', _priority_level,
    'tenant_id', _tenant_id
  );
  
  -- Create notification
  _notification_id := create_notification(
    'new_issue_reported',
    _user_id,
    _title,
    _message,
    CASE WHEN _priority_level = 'urgent' THEN 'high' ELSE 'normal' END,
    _issue_id,
    _metadata
  );
  
  -- Create maintenance notification record
  INSERT INTO maintenance_notifications (
    notification_id,
    property_id,
    property_address,
    unit_id,
    issue_id,
    issue_type,
    issue_title,
    issue_description,
    priority_level,
    tenant_id,
    tenant_name,
    tenant_contact,
    report_date,
    category_id,
    location_in_property
  ) VALUES (
    _notification_id,
    _property_id,
    _property_address,
    _unit_id,
    _issue_id,
    _issue_type,
    _issue_title,
    _issue_description,
    _priority_level,
    _tenant_id,
    _tenant_name,
    _tenant_contact,
    _report_date,
    _category_id,
    _location_in_property
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create lease expiry notification
CREATE OR REPLACE FUNCTION create_lease_expiry_notification(
  _user_id UUID,
  _tenant_id UUID,
  _tenant_name TEXT,
  _tenant_email TEXT,
  _tenant_phone TEXT,
  _property_id UUID,
  _property_address TEXT,
  _unit_id UUID,
  _expiry_date TIMESTAMPTZ,
  _lease_id UUID,
  _lease_start_date TIMESTAMPTZ,
  _current_rent DECIMAL,
  _market_rent_assessment DECIMAL,
  _days_until_expiry INTEGER
) RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
  _title TEXT;
  _message TEXT;
  _metadata JSONB;
BEGIN
  -- Format title and message
  _title := 'Lease Expiry Approaching';
  _message := format('%s''s lease at %s expires in %s days', 
                    _tenant_name, _property_address, _days_until_expiry);
  
  -- Create metadata
  _metadata := jsonb_build_object(
    'tenant_id', _tenant_id,
    'property_id', _property_id,
    'lease_id', _lease_id,
    'expiry_date', _expiry_date,
    'days_until_expiry', _days_until_expiry,
    'current_rent', _current_rent,
    'market_rent_assessment', _market_rent_assessment
  );
  
  -- Create notification
  _notification_id := create_notification(
    'lease_expiry_approaching',
    _user_id,
    _title,
    _message,
    'normal',
    _lease_id,
    _metadata
  );
  
  -- Create tenancy notification record
  INSERT INTO tenancy_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    unit_id,
    expiry_date,
    lease_id,
    lease_start_date,
    current_rent,
    market_rent_assessment
  ) VALUES (
    _notification_id,
    _tenant_id,
    _tenant_name,
    _tenant_email,
    _tenant_phone,
    _property_id,
    _property_address,
    _unit_id,
    _expiry_date,
    _lease_id,
    _lease_start_date,
    _current_rent,
    _market_rent_assessment
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create certificate expiry notification
CREATE OR REPLACE FUNCTION create_certificate_expiry_notification(
  _user_id UUID,
  _certificate_type TEXT,
  _certificate_id UUID,
  _regulatory_requirement_id UUID,
  _property_id UUID,
  _property_address TEXT,
  _unit_id UUID,
  _expiry_date TIMESTAMPTZ,
  _issue_date TIMESTAMPTZ,
  _issuing_authority TEXT,
  _days_until_expiry INTEGER
) RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
  _title TEXT;
  _message TEXT;
  _metadata JSONB;
BEGIN
  -- Format title and message
  _title := 'Certificate Expiry';
  _message := format('%s for %s expires in %s days', 
                    _certificate_type, _property_address, _days_until_expiry);
  
  -- Create metadata
  _metadata := jsonb_build_object(
    'property_id', _property_id,
    'certificate_id', _certificate_id,
    'certificate_type', _certificate_type,
    'expiry_date', _expiry_date,
    'days_until_expiry', _days_until_expiry
  );
  
  -- Create notification
  _notification_id := create_notification(
    'certificate_expiring',
    _user_id,
    _title,
    _message,
    'normal',
    _certificate_id,
    _metadata
  );
  
  -- Create compliance notification record
  INSERT INTO compliance_notifications (
    notification_id,
    certificate_type,
    certificate_id,
    regulatory_requirement_id,
    property_id,
    property_address,
    unit_id,
    expiry_date,
    issue_date,
    issuing_authority,
    days_remaining
  ) VALUES (
    _notification_id,
    _certificate_type,
    _certificate_id,
    _regulatory_requirement_id,
    _property_id,
    _property_address,
    _unit_id,
    _expiry_date,
    _issue_date,
    _issuing_authority,
    _days_until_expiry
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create a sample scheduled job to check for upcoming rent dues (would be run daily)
CREATE OR REPLACE FUNCTION check_upcoming_rent_dues() RETURNS void AS $$
BEGIN
  -- Logic to find rents due in 5 days and create notifications
  -- This would be implemented once you have tables for leases, payments, etc.
  -- Example pseudocode:
  /*
  FOR rent_record IN 
    SELECT * FROM payments 
    WHERE due_date = CURRENT_DATE + INTERVAL '5 days' AND status = 'pending'
  LOOP
    PERFORM create_upcoming_rent_due_notification(
      rent_record.landlord_id,
      rent_record.tenant_id,
      rent_record.tenant_name,
      rent_record.tenant_email,
      rent_record.tenant_phone,
      rent_record.property_id,
      rent_record.property_address,
      rent_record.unit_id,
      rent_record.amount,
      rent_record.due_date,
      rent_record.payment_id,
      rent_record.lease_id,
      rent_record.payment_period
    );
  END LOOP;
  */
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a sample scheduled job to check for expiring certificates
CREATE OR REPLACE FUNCTION check_expiring_certificates() RETURNS void AS $$
BEGIN
  -- Logic to find certificates expiring in 30, 14, etc. days
  -- This would be implemented once you have tables for certificates
  -- Example pseudocode:
  /*
  FOR cert_record IN 
    SELECT * FROM certificates 
    WHERE expiry_date = CURRENT_DATE + INTERVAL '30 days'
  LOOP
    PERFORM create_certificate_expiry_notification(
      cert_record.landlord_id,
      cert_record.certificate_type,
      cert_record.id,
      cert_record.regulatory_requirement_id,
      cert_record.property_id,
      cert_record.property_address,
      cert_record.unit_id,
      cert_record.expiry_date,
      cert_record.issue_date,
      cert_record.issuing_authority,
      30
    );
  END LOOP;
  */
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a sample trigger function for when a new maintenance issue is reported
CREATE OR REPLACE FUNCTION trigger_new_issue_notification() RETURNS TRIGGER AS $$
BEGIN
  -- This would be implemented once you have tables for issues
  -- Example pseudocode:
  /*
  PERFORM create_new_issue_notification(
    NEW.landlord_id,
    NEW.property_id,
    NEW.property_address,
    NEW.unit_id,
    NEW.id,
    NEW.issue_type,
    NEW.issue_title,
    NEW.issue_description,
    NEW.priority_level,
    NEW.tenant_id,
    NEW.tenant_name,
    NEW.tenant_contact,
    NEW.report_date,
    NEW.category_id,
    NEW.location_in_property
  );
  */
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sample comment showing how to attach the trigger to an issues table
-- CREATE TRIGGER new_issue_notification_trigger
--   AFTER INSERT ON issues
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_new_issue_notification();

-- Create a sample trigger function for when a payment is received
CREATE OR REPLACE FUNCTION trigger_payment_received_notification() RETURNS TRIGGER AS $$
BEGIN
  -- This would be implemented once you have tables for payments
  -- Example pseudocode:
  /*
  PERFORM create_payment_received_notification(
    NEW.landlord_id,
    NEW.tenant_id,
    NEW.tenant_name,
    NEW.tenant_email,
    NEW.tenant_phone,
    NEW.property_id,
    NEW.property_address,
    NEW.unit_id,
    NEW.amount,
    NEW.id,
    NEW.payment_date,
    NEW.payment_method,
    NEW.transaction_reference,
    NEW.bank_account_id
  );
  */
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sample comment showing how to attach the trigger to a payments table
-- CREATE TRIGGER payment_received_notification_trigger
--   AFTER INSERT ON payments
--   FOR EACH ROW
--   WHEN (NEW.status = 'completed')
--   EXECUTE FUNCTION trigger_payment_received_notification();

-- Create a function to demonstrate creating a sample notification
CREATE OR REPLACE FUNCTION create_sample_notification() RETURNS UUID AS $$
DECLARE
  _notification_id UUID;
BEGIN
  -- Create a sample rent payment received notification
  _notification_id := create_payment_received_notification(
    '00000000-0000-0000-0000-000000000001', -- sample user_id
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe', -- tenant_name
    'john.doe@example.com', -- tenant_email
    '+44 7700 900000', -- tenant_phone
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London', -- property_address
    NULL, -- unit_id
    750.00, -- payment_amount
    '00000000-0000-0000-0000-000000000004', -- sample payment_id
    NOW(), -- payment_date
    'Bank Transfer', -- payment_method
    'REF123456789', -- transaction_reference
    '00000000-0000-0000-0000-000000000005' -- sample bank_account_id
  );
  
  RETURN _notification_id;
END;
$$ LANGUAGE plpgsql;
