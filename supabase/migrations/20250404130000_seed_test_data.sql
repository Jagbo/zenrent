-- Create user in auth.users table
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '3d262808-31db-41fe-b352-acb56f61b013',
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
);

-- Seed properties
INSERT INTO properties (
  id,
  user_id,
  property_code,
  address,
  city,
  postcode,
  property_type,
  bedrooms,
  bathrooms,
  is_furnished,
  purchase_date,
  purchase_price,
  current_valuation,
  description,
  status,
  photo_url,
  energy_rating,
  council_tax_band,
  has_garden,
  has_parking,
  gas_safety_expiry,
  electrical_safety_expiry,
  notes,
  metadata,
  created_at,
  updated_at
) VALUES 
(
  '7a2e1487-f17b-4ceb-b6d1-56934589025b',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'prop_15_crescent_road',
  '15 Crescent Road',
  'London',
  'SW11 5PL',
  'flat',
  2,
  1,
  true,
  '2020-06-15',
  380000,
  450000,
  'Modern apartment in prime London location with excellent transport links. Recently renovated with high-end finishes.',
  'active',
  'https://example.com/properties/15-crescent-road.jpg',
  'B',
  'D',
  false,
  true,
  NOW() + INTERVAL '6 months',
  NOW() + INTERVAL '4 years',
  'Prime location property with strong rental demand',
  '{"amenities": ["Central Heating", "Double Glazing", "Fitted Kitchen", "Garden Access", "Bike Storage"], "year_built": 2005, "square_footage": 850}',
  NOW() - INTERVAL '3 years',
  NOW()
),
(
  'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'prop_42_harley_street',
  '42 Harley Street',
  'London',
  'W1G 8PR',
  'house',
  3,
  2,
  true,
  '2019-03-20',
  320000,
  380000,
  'Spacious family home in quiet residential area. Features a large garden and modern kitchen.',
  'active',
  'https://example.com/properties/42-harley-street.jpg',
  'C',
  'C',
  true,
  true,
  NOW() + INTERVAL '8 months',
  NOW() + INTERVAL '3 years',
  'Well-maintained property with long-term tenants',
  '{"amenities": ["Garden", "Central Heating", "Double Glazing", "Off-Street Parking", "Conservatory"], "year_built": 1998, "square_footage": 1200}',
  NOW() - INTERVAL '4 years',
  NOW()
),
(
  'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'prop_8_victoria_gardens',
  '8 Victoria Gardens',
  'Manchester',
  'M4 7DJ',
  'house',
  4,
  3,
  true,
  '2021-09-10',
  450000,
  520000,
  'Luxurious detached house with modern amenities and excellent schools nearby. Recently refurbished throughout.',
  'active',
  'https://example.com/properties/8-victoria-gardens.jpg',
  'A',
  'E',
  true,
  true,
  NOW() + INTERVAL '10 months',
  NOW() + INTERVAL '4 years',
  'High-end property with premium fixtures and fittings',
  '{"amenities": ["Garden", "Central Heating", "Double Glazing", "Garage", "Home Office", "Smart Home System"], "year_built": 2010, "square_footage": 1800}',
  NOW() - INTERVAL '2 years',
  NOW()
);

-- Create tenants
INSERT INTO tenants (
  id,
  user_id,
  name,
  email,
  phone,
  date_of_birth,
  employment_status,
  national_insurance_number,
  emergency_contact_name,
  emergency_contact_phone,
  photo_url,
  notes,
  referencing_status,
  credit_check_status,
  metadata,
  created_at,
  updated_at
) VALUES
(
  'a1b2c3d4-e5f6-4321-8765-9abc12345678',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'Sarah Johnson',
  'sarah.j@example.co.uk',
  '07700 900456',
  '1985-06-15',
  'Employed',
  'AB123456C',
  'John Johnson',
  '07700 900457',
  'https://example.com/tenants/sarah.jpg',
  'Excellent tenant with consistent payment history',
  'Completed',
  'Passed',
  '{"annual_income": 45000, "previous_addresses": ["123 Old Street, London, E1 6BT"]}',
  NOW(),
  NOW()
),
(
  'b2c3d4e5-f6a7-5432-8765-9abc12345679',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'Emma Clarke',
  'emma.c@example.co.uk',
  '07700 900789',
  '1990-03-20',
  'Self-Employed',
  'CD234567D',
  'Mark Clarke',
  '07700 900790',
  'https://example.com/tenants/emma.jpg',
  'Self-employed business owner with strong financials',
  'Completed',
  'Passed',
  '{"annual_income": 55000, "previous_addresses": ["456 New Road, London, N1 7DE"]}',
  NOW(),
  NOW()
),
(
  'c3d4e5f6-a7b8-6543-8765-9abc12345680',
  '3d262808-31db-41fe-b352-acb56f61b013',
  'David Wilson',
  'david.w@example.co.uk',
  '07700 900234',
  '1988-09-10',
  'Employed',
  'EF345678E',
  'Sarah Wilson',
  '07700 900235',
  'https://example.com/tenants/david.jpg',
  'Professional with stable employment history',
  'Completed',
  'Passed',
  '{"annual_income": 65000, "previous_addresses": ["789 High Street, Manchester, M1 4FG"]}',
  NOW(),
  NOW()
);

-- Create leases
INSERT INTO leases (
  id,
  tenant_id,
  property_id,
  property_uuid,
  start_date,
  end_date,
  rent_amount,
  status,
  deposit_amount,
  deposit_protection_scheme,
  deposit_protection_id,
  deposit_protected_on,
  lease_document_url,
  special_conditions,
  created_at,
  updated_at
) VALUES
(
  'a1b2c3d4-e5f6-4321-8765-9abc12345601',
  'a1b2c3d4-e5f6-4321-8765-9abc12345678',
  '7a2e1487-f17b-4ceb-b6d1-56934589025b',
  '7a2e1487-f17b-4ceb-b6d1-56934589025b',
  NOW() - INTERVAL '6 months',
  NOW() + INTERVAL '6 months',
  1200.00,
  'active',
  1800.00,
  'mydeposits',
  'DEP-001-2024',
  NOW() - INTERVAL '6 months',
  'https://example.com/leases/lease-001.pdf',
  'No pets allowed. Quarterly property inspections.',
  NOW() - INTERVAL '6 months',
  NOW()
),
(
  'b2c3d4e5-f6a7-5432-8765-9abc12345602',
  'b2c3d4e5-f6a7-5432-8765-9abc12345679',
  'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
  'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
  NOW() - INTERVAL '3 months',
  NOW() + INTERVAL '9 months',
  1500.00,
  'active',
  2250.00,
  'deposit_protection_service',
  'DEP-002-2024',
  NOW() - INTERVAL '3 months',
  'https://example.com/leases/lease-002.pdf',
  'Professional cleaning required at end of tenancy.',
  NOW() - INTERVAL '3 months',
  NOW()
),
(
  'c3d4e5f6-a7b8-6543-8765-9abc12345603',
  'c3d4e5f6-a7b8-6543-8765-9abc12345680',
  'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
  'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
  NOW() - INTERVAL '9 months',
  NOW() + INTERVAL '3 months',
  950.00,
  'active',
  1425.00,
  'tds_custodial',
  'DEP-003-2024',
  NOW() - INTERVAL '9 months',
  'https://example.com/leases/lease-003.pdf',
  'Garden maintenance included in rent.',
  NOW() - INTERVAL '9 months',
  NOW()
);

-- Create calendar events
INSERT INTO public.calendar_events (
    id,
    user_id,
    property_id,
    title,
    description,
    event_type,
    date,
    start_time,
    end_time,
    all_day,
    location,
    created_at,
    updated_at
) VALUES
-- Property Inspections
(
    'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    '3d262808-31db-41fe-b352-acb56f61b013',
    '7a2e1487-f17b-4ceb-b6d1-56934589025b',
    'Quarterly Inspection - 15 Crescent Road',
    'Regular property inspection for maintenance and condition assessment',
    'inspection',
    CURRENT_DATE + INTERVAL '2 weeks',
    '10:00',
    '12:00',
    false,
    '15 Crescent Road, London, SW11 5PL',
    NOW(),
    NOW()
),
-- Gas Safety Check
(
    'f2e3d4c5-b6a7-5f8e-9d0c-1e2f3a4b5c6d',
    '3d262808-31db-41fe-b352-acb56f61b013',
    'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
    'Gas Safety Certificate Renewal - 42 Harley Street',
    'Annual gas safety inspection and certificate renewal',
    'compliance',
    CURRENT_DATE + INTERVAL '1 month',
    '09:00',
    '12:00',
    false,
    '42 Harley Street, London, W1G 8PR',
    NOW(),
    NOW()
),
-- Lease Renewal
(
    'a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
    '3d262808-31db-41fe-b352-acb56f61b013',
    'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
    'Lease Renewal Discussion - 8 Victoria Gardens',
    'Schedule meeting with tenant to discuss lease renewal terms',
    'tenancy',
    CURRENT_DATE + INTERVAL '3 months',
    '14:00',
    '15:00',
    false,
    '8 Victoria Gardens, Manchester, M4 7DJ',
    NOW(),
    NOW()
);

-- Create issues
INSERT INTO public.issues (
    id,
    title,
    description,
    property_id,
    status,
    priority,
    type,
    tenant_id,
    is_emergency,
    created_at,
    updated_at
) VALUES
(
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d',
    'Leaking Faucet',
    'Kitchen sink faucet is dripping continuously',
    '7a2e1487-f17b-4ceb-b6d1-56934589025b',
    'Todo',
    'Medium',
    'Bug',
    'a1b2c3d4-e5f6-4321-8765-9abc12345678',
    false,
    NOW(),
    NOW()
),
(
    'b2c3d4e5-f6a7-4a5b-9c8d-7e6f5a4b3c2e',
    'Heating Issue',
    'Radiator in living room not heating properly',
    'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
    'Todo',
    'High',
    'Bug',
    'b2c3d4e5-f6a7-5432-8765-9abc12345679',
    true,
    NOW(),
    NOW()
),
(
    'c3d4e5f6-a7b8-4a5b-9c8d-7e6f5a4b3c2f',
    'Roof Inspection',
    'Regular maintenance check for roof condition',
    'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
    'Todo',
    'Low',
    'Bug',
    NULL,
    false,
    NOW(),
    NOW()
);

-- Create bank connections
INSERT INTO public.bank_connections (id, property_id, plaid_access_token, plaid_item_id, cursor, created_at)
VALUES 
(1, '7a2e1487-f17b-4ceb-b6d1-56934589025b', 'access-sandbox-123456789', 'item-sandbox-123456789', 'cursor-123456789', NOW() - INTERVAL '30 days'),
(2, 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', 'access-sandbox-987654321', 'item-sandbox-987654321', 'cursor-987654321', NOW() - INTERVAL '25 days'),
(3, 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', 'access-sandbox-456789123', 'item-sandbox-456789123', 'cursor-456789123', NOW() - INTERVAL '20 days');

-- Create bank transactions
INSERT INTO public.bank_transactions (property_id, plaid_transaction_id, amount, date, name, merchant_name, category, pending, created_at)
VALUES
-- 15 Crescent Road transactions
('7a2e1487-f17b-4ceb-b6d1-56934589025b', 'tx_12345678901', 1200.00, NOW() - INTERVAL '30 days', 'JOHNSON SARAH RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '30 days'),
('7a2e1487-f17b-4ceb-b6d1-56934589025b', 'tx_12345678902', 1200.00, NOW() - INTERVAL '60 days', 'JOHNSON SARAH RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '60 days'),
('7a2e1487-f17b-4ceb-b6d1-56934589025b', 'tx_12345678903', -125.50, NOW() - INTERVAL '15 days', 'BRITISH GAS PAYMENT', 'British Gas', ARRAY['Utilities', 'Gas'], false, NOW() - INTERVAL '15 days'),

-- 42 Harley Street transactions
('bd8e3211-2403-47ac-9947-7a4842c5a4e3', 'tx_23456789101', 1500.00, NOW() - INTERVAL '25 days', 'CLARKE EMMA RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '25 days'),
('bd8e3211-2403-47ac-9947-7a4842c5a4e3', 'tx_23456789102', 1500.00, NOW() - INTERVAL '55 days', 'CLARKE EMMA RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '55 days'),
('bd8e3211-2403-47ac-9947-7a4842c5a4e3', 'tx_23456789103', -195.75, NOW() - INTERVAL '10 days', 'EDF ENERGY', 'EDF Energy', ARRAY['Utilities', 'Electricity'], false, NOW() - INTERVAL '10 days'),

-- 8 Victoria Gardens transactions
('dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', 'tx_34567891201', 950.00, NOW() - INTERVAL '20 days', 'WILSON DAVID RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '20 days'),
('dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', 'tx_34567891202', 950.00, NOW() - INTERVAL '50 days', 'WILSON DAVID RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '50 days'),
('dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', 'tx_34567891203', -110.25, NOW() - INTERVAL '8 days', 'MANCHESTER ENERGY', 'Manchester Energy', ARRAY['Utilities', 'Electricity'], false, NOW() - INTERVAL '8 days');

-- Create income records
INSERT INTO income (id, property_id, date, income_type, category, description, amount)
VALUES
  -- 15 Crescent Road
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 1200),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 1200),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 1200),
  
  -- 42 Harley Street
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 1500),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 1500),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 1500),
  
  -- 8 Victoria Gardens
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 950),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 950),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 950);

-- Create expense records
INSERT INTO expenses (id, property_id, date, expense_type, category, description, amount)
VALUES
  -- 15 Crescent Road
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 200),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 200),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 200),
  
  -- 42 Harley Street
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 300),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 300),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 300),
  
  -- 8 Victoria Gardens
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 150),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 150),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance', 150);

-- Create financial metrics
INSERT INTO financial_metrics (id, property_id, period_start, period_end, roi_percentage, yield_percentage, occupancy_rate)
VALUES
  -- 15 Crescent Road
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 7.8, 6.7, 100),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 7.9, 6.8, 100),
  
  -- 42 Harley Street
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 8.2, 7.1, 100),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 8.3, 7.2, 100),
  
  -- 8 Victoria Gardens
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 7.5, 6.5, 100),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 7.6, 6.6, 100); 