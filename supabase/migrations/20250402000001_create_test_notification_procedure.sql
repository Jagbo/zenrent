-- Create a procedure to generate test notifications
CREATE OR REPLACE PROCEDURE generate_test_notifications()
LANGUAGE plpgsql
AS $$
DECLARE
  _notification_id UUID;
  _user_id UUID := 'b85371f5-2ec6-4ceb-9526-51a60d19fcc2'::UUID;
  _tenant_id UUID;
  _property_id UUID;
  _lease_id UUID;
  _unit_id UUID;
BEGIN
  -- Generate random UUIDs for test data
  _tenant_id := gen_random_uuid();
  _property_id := gen_random_uuid();
  _lease_id := gen_random_uuid();
  _unit_id := gen_random_uuid();

  -- Create a sample rent payment received notification
  _notification_id := create_payment_received_notification(
    _user_id,
    _tenant_id,
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    _property_id,
    '123 Main Street, London',
    _unit_id,
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
    _unit_id,
    750.00,
    NOW() + INTERVAL '7 days'
  );

  -- Create a sample maintenance issue notification
  _notification_id := create_maintenance_issue_notification(
    _user_id,
    _property_id,
    '123 Main Street, London',
    _unit_id,
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
    _unit_id,
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
    _unit_id,
    NOW() + INTERVAL '30 days'
  );
END;
$$; 