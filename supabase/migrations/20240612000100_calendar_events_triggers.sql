-- Create triggers to automatically add calendar events for important activities

-- Function to create rent due calendar events when a new lease is created
CREATE OR REPLACE FUNCTION create_rent_due_calendar_events()
RETURNS TRIGGER AS $$
DECLARE
  due_date DATE;
  payment_frequency TEXT;
  months_to_add INTEGER;
  property_owner_id UUID;
BEGIN
  -- In the future, we'll get property owner from properties table
  -- For now, just use the current user ID
  property_owner_id := auth.uid();
  
  /*
  -- This code will be uncommented when properties table exists
  SELECT user_id INTO property_owner_id
  FROM properties
  WHERE property_code = NEW.property_id;
  
  IF property_owner_id IS NULL THEN
    property_owner_id := auth.uid();
  END IF;
  */
  
  -- Default values
  payment_frequency := COALESCE(NEW.payment_frequency, 'monthly');
  months_to_add := CASE
    WHEN payment_frequency = 'weekly' THEN 0
    WHEN payment_frequency = 'biweekly' THEN 0
    WHEN payment_frequency = 'monthly' THEN 1
    WHEN payment_frequency = 'quarterly' THEN 3
    WHEN payment_frequency = 'annually' THEN 12
    ELSE 1
  END;
  
  -- Create first rent due event
  due_date := COALESCE(NEW.first_payment_date, NEW.start_date);
  
  INSERT INTO calendar_events (
    user_id,
    title,
    date,
    all_day,
    location,
    event_type,
    property_id,
    description
  ) VALUES (
    property_owner_id,
    'Rent Due - ' || COALESCE(NEW.tenant_name, 'Tenant'),
    due_date,
    TRUE,
    COALESCE(NEW.property_address, 'Property'),
    'payment',
    NEW.property_id,
    'Rent payment of ' || COALESCE(NEW.rent_amount::TEXT, 'TBD') || ' due from ' || COALESCE(NEW.tenant_name, 'tenant')
  );
  
  -- For leases longer than a month, create additional events for the duration
  -- Only create up to 12 events to avoid flooding the calendar
  IF months_to_add > 0 AND NEW.end_date IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      -- Calculate next due date based on payment frequency
      IF payment_frequency = 'monthly' THEN
        due_date := due_date + INTERVAL '1 month';
      ELSIF payment_frequency = 'quarterly' THEN
        due_date := due_date + INTERVAL '3 months';
      ELSIF payment_frequency = 'annually' THEN
        due_date := due_date + INTERVAL '1 year';
      ELSIF payment_frequency = 'weekly' THEN
        due_date := due_date + INTERVAL '1 week';
      ELSIF payment_frequency = 'biweekly' THEN
        due_date := due_date + INTERVAL '2 weeks';
      END IF;
      
      -- Stop if we've gone past the lease end date
      IF NEW.end_date IS NOT NULL AND due_date > NEW.end_date THEN
        EXIT;
      END IF;
      
      -- Create calendar event for this due date
      INSERT INTO calendar_events (
        user_id,
        title,
        date,
        all_day,
        location,
        event_type,
        property_id,
        description
      ) VALUES (
        property_owner_id,
        'Rent Due - ' || COALESCE(NEW.tenant_name, 'Tenant'),
        due_date,
        TRUE,
        COALESCE(NEW.property_address, 'Property'),
        'payment',
        NEW.property_id,
        'Rent payment of ' || COALESCE(NEW.rent_amount::TEXT, 'TBD') || ' due from ' || COALESCE(NEW.tenant_name, 'tenant')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create calendar events for property inspections
CREATE OR REPLACE FUNCTION create_inspection_calendar_events()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id UUID;
BEGIN
  -- In the future, we'll get property owner from properties table
  -- For now, just use the current user ID
  property_owner_id := auth.uid();
  
  /*
  -- This code will be uncommented when properties table exists
  SELECT user_id INTO property_owner_id
  FROM properties
  WHERE property_code = NEW.property_id;
  
  IF property_owner_id IS NULL THEN
    property_owner_id := auth.uid();
  END IF;
  */
  
  -- Create calendar event for the inspection
  INSERT INTO calendar_events (
    user_id,
    title,
    date,
    start_time,
    end_time,
    location,
    event_type,
    property_id,
    description
  ) VALUES (
    property_owner_id,
    COALESCE(NEW.inspection_type, 'Property') || ' Inspection',
    NEW.inspection_date,
    NEW.start_time,
    COALESCE(NEW.end_time, (NEW.start_time::TIME + INTERVAL '1 hour')::TIME),
    COALESCE(NEW.property_address, 'Property'),
    'inspection',
    NEW.property_id,
    COALESCE(NEW.inspection_notes, 'Scheduled property inspection')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create calendar events for maintenance visits
CREATE OR REPLACE FUNCTION create_maintenance_calendar_events()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id UUID;
BEGIN
  -- Only create events for scheduled maintenance
  IF NEW.status != 'scheduled' THEN
    RETURN NEW;
  END IF;
  
  -- In the future, we'll get property owner from properties table
  -- For now, just use the current user ID
  property_owner_id := auth.uid();
  
  /*
  -- This code will be uncommented when properties table exists
  SELECT user_id INTO property_owner_id
  FROM properties
  WHERE property_code = NEW.property_id;
  
  IF property_owner_id IS NULL THEN
    property_owner_id := auth.uid();
  END IF;
  */
  
  -- Create calendar event for the maintenance visit
  INSERT INTO calendar_events (
    user_id,
    title,
    date,
    start_time,
    end_time,
    location,
    event_type,
    property_id,
    description
  ) VALUES (
    property_owner_id,
    'Maintenance: ' || COALESCE(NEW.issue_title, 'Visit'),
    NEW.scheduled_date,
    NEW.scheduled_start_time,
    COALESCE(NEW.scheduled_end_time, (NEW.scheduled_start_time::TIME + INTERVAL '2 hours')::TIME),
    COALESCE(NEW.property_address, 'Property'),
    'maintenance',
    NEW.property_id,
    COALESCE(NEW.issue_description, 'Scheduled maintenance visit')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to relevant tables (assuming these tables exist)
-- Uncomment these when the corresponding tables are created

-- CREATE TRIGGER create_rent_due_events_trigger
-- AFTER INSERT ON leases
-- FOR EACH ROW
-- EXECUTE FUNCTION create_rent_due_calendar_events();

-- CREATE TRIGGER create_inspection_events_trigger
-- AFTER INSERT ON property_inspections
-- FOR EACH ROW
-- EXECUTE FUNCTION create_inspection_calendar_events();

-- CREATE TRIGGER create_maintenance_events_trigger
-- AFTER INSERT OR UPDATE OF status, scheduled_date ON maintenance_issues
-- FOR EACH ROW
-- WHEN (NEW.status = 'scheduled')
-- EXECUTE FUNCTION create_maintenance_calendar_events(); 