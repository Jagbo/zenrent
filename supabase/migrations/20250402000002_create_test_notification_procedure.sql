-- Create a procedure to generate test notifications
CREATE OR REPLACE PROCEDURE generate_test_notifications()
LANGUAGE plpgsql
AS $$
DECLARE
  _notification_id UUID;
  _user_id UUID;
  _tenant_id UUID;
  _property_id UUID;
  _lease_id UUID;
BEGIN
  -- Get the first user from auth.users table
  SELECT id INTO _user_id FROM auth.users LIMIT 1;
  
  -- Return early if no user exists
  IF _user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate random UUIDs for test data
  _tenant_id := gen_random_uuid();
  _property_id := gen_random_uuid();
  _lease_id := gen_random_uuid();

  -- Create a sample rent payment received notification
  _notification_id := create_payment_received_notification(
    _user_id,
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    _property_id,
    '123 Main Street, London',
    NULL,
    750.00,
    gen_random_uuid(),
    NOW(),
    'Bank Transfer',
    'REF123456789',
    gen_random_uuid()
  );

  -- Create a sample upcoming rent due notification
  _notification_id := create_upcoming_rent_due_notification(
    _user_id,
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    _property_id,
    '123 Main Street, London',
    NULL,
    750.00,
    NOW() + INTERVAL '7 days'
  );

  -- Create a sample maintenance issue notification
  _notification_id := create_maintenance_issue_notification(
    _user_id,
    _property_id,
    '123 Main Street, London',
    NULL,
    'Leaking Faucet',
    'The kitchen faucet is leaking and needs repair.',
    'LOW',
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000'
  );

  -- Create a sample urgent maintenance issue notification
  _notification_id := create_maintenance_issue_notification(
    _user_id,
    _property_id,
    '123 Main Street, London',
    NULL,
    'Boiler Not Working',
    'The boiler has stopped working and there is no hot water.',
    'HIGH',
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000'
  );

  -- Create a sample lease expiring notification
  _notification_id := create_lease_expiring_notification(
    _user_id,
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    _lease_id,
    _property_id,
    '123 Main Street, London',
    NULL,
    NOW() + INTERVAL '30 days'
  );
END;
$$; 