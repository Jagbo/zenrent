-- Create a procedure to generate test notifications
CREATE OR REPLACE PROCEDURE generate_test_notifications()
LANGUAGE plpgsql
AS $$
DECLARE
  _user_id UUID;
  _notification_id UUID;
BEGIN
  -- Create test UUID for a landlord user
  _user_id := '00000000-0000-0000-0000-000000000001';
  
  -- Create a sample rent payment received notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    1, -- payment_received notification type
    _user_id,
    'Rent Payment Received',
    'Rent payment of £750 received from John Doe for 123 Main Street, London',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related rent payment notification
  INSERT INTO rent_payment_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    payment_amount,
    payment_date,
    payment_method,
    transaction_reference
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    750.00,
    NOW(),
    'Bank Transfer',
    'REF123456789'
  );
  
  -- Create a sample upcoming rent due notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    2, -- upcoming_rent_due notification type
    _user_id,
    'Upcoming Rent Due',
    'Rent of £750 due in 5 days from John Doe for 123 Main Street, London',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related rent payment notification
  INSERT INTO rent_payment_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    payment_amount,
    due_date
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    750.00,
    NOW() + INTERVAL '5 days'
  );
  
  -- Create a sample maintenance issue notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    7, -- new_issue_reported notification type
    _user_id,
    'New Maintenance Issue',
    'New medium issue reported at 123 Main Street, London: Leaking faucet in kitchen',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related maintenance notification
  INSERT INTO maintenance_notifications (
    notification_id,
    property_id,
    property_address,
    issue_title,
    issue_description,
    priority_level,
    tenant_id,
    tenant_name,
    tenant_contact,
    report_date
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    'Leaking faucet in kitchen',
    'The kitchen sink has a slow drip that is getting worse.',
    'medium',
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe',
    'john.doe@example.com',
    NOW()
  );
  
  -- Create a sample urgent maintenance issue notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    8, -- urgent_issue_reported notification type
    _user_id,
    'URGENT: Maintenance Issue',
    'URGENT: Boiler not working reported at 123 Main Street, London by John Doe',
    'high',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related maintenance notification
  INSERT INTO maintenance_notifications (
    notification_id,
    property_id,
    property_address,
    issue_title,
    issue_description,
    priority_level,
    tenant_id,
    tenant_name,
    tenant_contact,
    report_date
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    'Boiler not working',
    'No heating or hot water. Boiler displays error code E01.',
    'urgent',
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe',
    'john.doe@example.com',
    NOW()
  );
  
  -- Create a sample lease expiring notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    17, -- lease_expiry_approaching notification type
    _user_id,
    'Lease Expiry Approaching',
    'John Doe''s lease at 123 Main Street, London expires in 30 days',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related tenancy notification
  INSERT INTO tenancy_notifications (
    notification_id,
    tenant_id,
    tenant_name,
    tenant_email,
    tenant_phone,
    property_id,
    property_address,
    expiry_date,
    lease_start_date,
    current_rent
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000002', -- sample tenant_id
    'John Doe',
    'john.doe@example.com',
    '+44 7700 900000',
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '11 months',
    750.00
  );
  
  -- Create a sample certificate expiring notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    21, -- certificate_expiring notification type
    _user_id,
    'Certificate Expiry',
    'Gas Safety Certificate for 123 Main Street, London expires in 30 days',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related compliance notification
  INSERT INTO compliance_notifications (
    notification_id,
    certificate_type,
    property_id,
    property_address,
    expiry_date,
    issue_date,
    issuing_authority,
    days_remaining
  ) 
  VALUES (
    _notification_id,
    'Gas Safety Certificate',
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '11 months',
    'GasSafe Register',
    30
  );
  
  -- Create a sample property performance notification
  INSERT INTO notifications (
    notification_type_id, 
    user_id, 
    title, 
    message, 
    priority, 
    created_at
  ) 
  VALUES (
    26, -- property_performance_summary notification type
    _user_id,
    'Monthly Property Performance',
    'Monthly summary for 123 Main Street, London: Income £750, Expenses £150, ROI 8%',
    'normal',
    NOW()
  )
  RETURNING id INTO _notification_id;
  
  -- Create the related property performance notification
  INSERT INTO property_performance_notifications (
    notification_id,
    property_id,
    property_address,
    total_income,
    total_expenses,
    net_profit,
    roi_percentage,
    period_start_date,
    period_end_date
  ) 
  VALUES (
    _notification_id,
    '00000000-0000-0000-0000-000000000003', -- sample property_id
    '123 Main Street, London',
    750.00,
    150.00,
    600.00,
    8.0,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'
  );
END;
$$;
