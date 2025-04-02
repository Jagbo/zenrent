-- Create bank connections using property_code (as per rule)
INSERT INTO public.bank_connections (id, property_id, plaid_access_token, plaid_item_id, cursor, created_at)
VALUES 
(1, 'prop_15_crescent_road', 'access-sandbox-123456789', 'item-sandbox-123456789', 'cursor-123456789', NOW() - INTERVAL '30 days'),
(2, 'prop_42_harley_street', 'access-sandbox-987654321', 'item-sandbox-987654321', 'cursor-987654321', NOW() - INTERVAL '25 days'),
(3, 'prop_8_victoria_gardens', 'access-sandbox-456789123', 'item-sandbox-456789123', 'cursor-456789123', NOW() - INTERVAL '20 days');

-- Create bank transactions using property_code (as per rule)
INSERT INTO public.bank_transactions (property_id, plaid_transaction_id, amount, date, name, merchant_name, category, pending, created_at)
VALUES
-- 15 Crescent Road transactions
('prop_15_crescent_road', 'tx_12345678901', 1200.00, NOW() - INTERVAL '30 days', 'JOHNSON SARAH RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '30 days'),
('prop_15_crescent_road', 'tx_12345678902', 1200.00, NOW() - INTERVAL '60 days', 'JOHNSON SARAH RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '60 days'),
('prop_15_crescent_road', 'tx_12345678903', -125.50, NOW() - INTERVAL '15 days', 'BRITISH GAS PAYMENT', 'British Gas', ARRAY['Utilities', 'Gas'], false, NOW() - INTERVAL '15 days'),
('prop_15_crescent_road', 'tx_12345678904', -45.00, NOW() - INTERVAL '22 days', 'THAMES WATER', 'Thames Water', ARRAY['Utilities', 'Water'], false, NOW() - INTERVAL '22 days'),
('prop_15_crescent_road', 'tx_12345678905', -180.00, NOW() - INTERVAL '28 days', 'COUNCIL TAX PAYMENT', 'London Borough Council', ARRAY['Housing', 'Council Tax'], false, NOW() - INTERVAL '28 days'),
('prop_15_crescent_road', 'tx_12345678906', -250.00, NOW() - INTERVAL '5 days', 'HANDYMAN SERVICES LTD', 'Handyman Services', ARRAY['Home', 'Maintenance'], false, NOW() - INTERVAL '5 days'),

-- 42 Harley Street transactions
('prop_42_harley_street', 'tx_23456789101', 1500.00, NOW() - INTERVAL '25 days', 'CLARKE EMMA RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '25 days'),
('prop_42_harley_street', 'tx_23456789102', 1500.00, NOW() - INTERVAL '55 days', 'CLARKE EMMA RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '55 days'),
('prop_42_harley_street', 'tx_23456789103', -195.75, NOW() - INTERVAL '10 days', 'EDF ENERGY', 'EDF Energy', ARRAY['Utilities', 'Electricity'], false, NOW() - INTERVAL '10 days'),
('prop_42_harley_street', 'tx_23456789104', -55.00, NOW() - INTERVAL '20 days', 'THAMES WATER', 'Thames Water', ARRAY['Utilities', 'Water'], false, NOW() - INTERVAL '20 days'),
('prop_42_harley_street', 'tx_23456789105', -225.00, NOW() - INTERVAL '22 days', 'WESTMINSTER COUNCIL TAX', 'Westminster Council', ARRAY['Housing', 'Council Tax'], false, NOW() - INTERVAL '22 days'),
('prop_42_harley_street', 'tx_23456789106', -85.00, NOW() - INTERVAL '3 days', 'LONDON PLUMBERS LTD', 'London Plumbers', ARRAY['Home', 'Maintenance'], false, NOW() - INTERVAL '3 days'),

-- 8 Victoria Gardens transactions
('prop_8_victoria_gardens', 'tx_34567891201', 950.00, NOW() - INTERVAL '20 days', 'WILSON DAVID RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '20 days'),
('prop_8_victoria_gardens', 'tx_34567891202', 950.00, NOW() - INTERVAL '50 days', 'WILSON DAVID RENT', 'N/A', ARRAY['Income', 'Rent'], false, NOW() - INTERVAL '50 days'),
('prop_8_victoria_gardens', 'tx_34567891203', -110.25, NOW() - INTERVAL '8 days', 'MANCHESTER ENERGY', 'Manchester Energy', ARRAY['Utilities', 'Electricity'], false, NOW() - INTERVAL '8 days'),
('prop_8_victoria_gardens', 'tx_34567891204', -40.00, NOW() - INTERVAL '18 days', 'UNITED UTILITIES', 'United Utilities', ARRAY['Utilities', 'Water'], false, NOW() - INTERVAL '18 days'),
('prop_8_victoria_gardens', 'tx_34567891205', -145.00, NOW() - INTERVAL '25 days', 'MANCHESTER CITY COUNCIL', 'Manchester City Council', ARRAY['Housing', 'Council Tax'], false, NOW() - INTERVAL '25 days'),
('prop_8_victoria_gardens', 'tx_34567891206', -120.00, NOW() - INTERVAL '2 days', 'NORTH WEST MAINTENANCE', 'NW Maintenance', ARRAY['Home', 'Maintenance'], false, NOW() - INTERVAL '2 days');

-- Seed income data for the last 6 months - USE PROPERTY UUIDs
INSERT INTO income (id, property_id, date, income_type, category, description, amount)
VALUES
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '5 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '4 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '3 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 2500),
  
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '5 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '4 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '3 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 2000),
  
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '5 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 3000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '4 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 3000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '3 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 3000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Rent', 'Monthly Rent', 'Monthly rental income', 3000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Rent', 'Monthly Rent', 'Monthly rental income', 3000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Rent', 'Monthly Rent', 'Monthly rental income', 3000);

-- Seed expense data for the last 6 months - USE PROPERTY UUIDs
INSERT INTO expenses (id, property_id, date, expense_type, category, description, amount)
VALUES
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '5 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '4 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '3 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 800),
  
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '5 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '4 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '3 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 600),
  
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '5 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '4 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '3 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Maintenance', 'Regular Maintenance', 'Monthly maintenance and repairs', 1000);

-- Seed financial metrics - USE PROPERTY UUIDs
INSERT INTO financial_metrics (id, property_id, period_start, period_end, roi_percentage, yield_percentage, occupancy_rate)
VALUES
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 7.8, 6.7, 95.0),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 7.2, 6.3, 95.0),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 8.5, 6.9, 95.0);

-- Sample service charges (using property UUIDs from properties table)
INSERT INTO service_charges (id, property_id, date, type, description, status, amount) VALUES
    -- 15 Crescent Road service charges
    (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', '2024-01-01', 'maintenance', 'Building maintenance and cleaning', 'active', 100.00),
    
    -- 42 Harley Street service charges
    (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', '2024-01-01', 'maintenance', 'Common area maintenance', 'active', 150.00);

-- Sample invoices (using property UUIDs from properties table)
INSERT INTO invoices (id, property_id, date, invoice_number, description, status, amount) VALUES
    -- 15 Crescent Road invoices
    (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', '2024-03-01', 'INV-2024-001', 'March maintenance invoice', 'paid', 250.00),
    
    -- 42 Harley Street invoices
    (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', '2024-03-01', 'INV-2024-002', 'March insurance invoice', 'pending', 450.00),
    
    -- 8 Victoria Gardens invoices
    (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', '2024-03-01', 'INV-2024-003', 'March utilities invoice', 'paid', 200.00);

-- Create notifications with proper property linkage
DO $$
DECLARE
  user_id UUID := '00000000-0000-0000-0000-000000000001';
  property1_id UUID := 'bd8e3211-2403-47ac-9947-7a4842c5a4e3';
  property2_id UUID := 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8';
  property3_id UUID := '7a2e1487-f17b-4ceb-b6d1-56934589025b';
  tenant1_id UUID := gen_random_uuid();
  tenant2_id UUID := gen_random_uuid();
  tenant3_id UUID := gen_random_uuid();
  notification1_id UUID := gen_random_uuid();
  notification2_id UUID := gen_random_uuid();
  notification3_id UUID := gen_random_uuid();
  notification4_id UUID := gen_random_uuid();
  notification5_id UUID := gen_random_uuid();
  notification6_id UUID := gen_random_uuid();
  notification7_id UUID := gen_random_uuid();
  payment_id UUID := gen_random_uuid();
  issue_id UUID := gen_random_uuid();
  lease_id UUID := gen_random_uuid();
BEGIN
  -- Create notifications
  INSERT INTO public.notifications (id, notification_type_id, user_id, title, message, is_read, created_at)
  VALUES 
    (notification1_id, 1, user_id, 'Rent Payment Received', 'Rent payment of £1,200 received from Sarah Johnson for 15 Crescent Road', false, NOW() - INTERVAL '2 days'),
    (notification2_id, 7, user_id, 'New Maintenance Issue', 'New medium priority issue reported at 42 Harley Street: Leaking bathroom tap', false, NOW() - INTERVAL '1 day'),
    (notification3_id, 17, user_id, 'Lease Expiry Approaching', 'David Wilson''s lease at 8 Victoria Gardens expires in 30 days', false, NOW()),
    (notification4_id, 13, user_id, 'Invoice Received', 'New invoice of £85 from London Plumbers Ltd for 42 Harley Street', false, NOW() - INTERVAL '3 days'),
    (notification5_id, 25, user_id, 'Rent Increase Opportunity', 'Rent increase opportunity for 15 Crescent Road - current: £1,200, market: £1,350', false, NOW() - INTERVAL '5 days'),
    (notification6_id, 21, user_id, 'Certificate Expiring', 'Gas Safety Certificate for 15 Crescent Road expires in 30 days', false, NOW() - INTERVAL '1 day'),
    (notification7_id, 10, user_id, 'Issue Resolved', 'Issue at 8 Victoria Gardens has been resolved: Broken window latch', true, NOW() - INTERVAL '7 days');

  -- Create rent payment notification
  INSERT INTO public.rent_payment_notifications (notification_id, tenant_id, tenant_name, tenant_email, tenant_phone, property_id, property_address, payment_amount, payment_id, payment_date, payment_method, transaction_reference)
  VALUES (notification1_id, tenant1_id, 'Sarah Johnson', 'sarah.j@example.co.uk', '07700 900456', property1_id, '15 Crescent Road, London, SW11 5PL', 1200, payment_id, NOW() - INTERVAL '2 days', 'Bank Transfer', 'REF123456789');

  -- Create maintenance notification
  INSERT INTO public.maintenance_notifications (notification_id, property_id, property_address, issue_id, issue_title, issue_type, issue_description, priority_level, tenant_id, tenant_name, tenant_contact, report_date)
  VALUES (notification2_id, property2_id, '42 Harley Street, London, W1G 8PR', issue_id, 'Leaking bathroom tap', 'Plumbing', 'Continuous dripping from cold water tap in main bathroom', 'Medium', tenant2_id, 'Emma Clarke', '07700 900789', NOW() - INTERVAL '1 day');

  -- Create tenancy notification
  INSERT INTO public.tenancy_notifications (notification_id, tenant_id, tenant_name, tenant_email, tenant_phone, property_id, property_address, expiry_date, lease_id, current_rent, lease_start_date)
  VALUES (notification3_id, tenant3_id, 'David Wilson', 'david.w@example.co.uk', '07700 900234', property3_id, '8 Victoria Gardens, Manchester, M4 7DJ', NOW() + INTERVAL '30 days', lease_id, 950, NOW() - INTERVAL '11 months');

  -- Create financial notification
  INSERT INTO public.financial_notifications (notification_id, supplier_id, supplier_name, supplier_contact, invoice_amount, invoice_id, invoice_date, property_id, property_address, service_description, due_date)
  VALUES (notification4_id, gen_random_uuid(), 'London Plumbers Ltd', 'contact@londonplumbers.co.uk', 85, gen_random_uuid(), NOW() - INTERVAL '3 days', property2_id, '42 Harley Street, London, W1G 8PR', 'Emergency call-out to fix leaking pipe', NOW() + INTERVAL '14 days');

  -- Create property performance notification
  INSERT INTO public.property_performance_notifications (notification_id, property_id, property_address, current_rent, market_average, percentage_difference, rent_review_date)
  VALUES (notification5_id, property1_id, '15 Crescent Road, London, SW11 5PL', 1200, 1350, 12.5, NOW() + INTERVAL '2 months');
  
  -- Create compliance notification
  INSERT INTO public.compliance_notifications (notification_id, certificate_type, property_id, property_address, expiry_date, issue_date, issuing_authority, renewal_cost_estimate)
  VALUES (notification6_id, 'Gas Safety Certificate', property1_id, '15 Crescent Road, London, SW11 5PL', NOW() + INTERVAL '30 days', NOW() - INTERVAL '11 months', 'Gas Safe Register', 85);
  
  -- Create issue resolution notification
  INSERT INTO public.maintenance_notifications (notification_id, property_id, property_address, issue_id, issue_title, issue_type, resolution_details, resolution_date, cost_amount)
  VALUES (notification7_id, property3_id, '8 Victoria Gardens, Manchester, M4 7DJ', gen_random_uuid(), 'Broken window latch', 'Window/Door', 'Replaced window latch and realigned window frame', NOW() - INTERVAL '7 days', 95);
END $$;

-- Update financial metrics with more detailed data
INSERT INTO financial_metrics (id, property_id, period_start, period_end, roi_percentage, yield_percentage, occupancy_rate)
VALUES
  -- 8 Victoria Gardens (Monthly metrics for the last 6 months)
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE - INTERVAL '4 months', 7.8, 6.7, 100.0),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '3 months', 7.9, 6.8, 100.0),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '2 months', 8.0, 6.9, 100.0),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 8.1, 7.0, 100.0),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 8.2, 7.1, 100.0),
  
  -- 15 Crescent Road (Monthly metrics for the last 6 months)
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE - INTERVAL '4 months', 7.2, 6.3, 95.0),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '3 months', 7.3, 6.4, 95.0),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '2 months', 7.4, 6.5, 100.0),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 7.5, 6.6, 100.0),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 7.6, 6.7, 100.0),
  
  -- 42 Harley Street (Monthly metrics for the last 6 months)
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE - INTERVAL '4 months', 8.5, 6.9, 100.0),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '3 months', 8.6, 7.0, 100.0),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '2 months', 8.7, 7.1, 100.0),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '1 month', 8.8, 7.2, 100.0),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 8.9, 7.3, 100.0);

-- Add more detailed income records
INSERT INTO income (id, property_id, date, income_type, category, description, amount)
VALUES
  -- 8 Victoria Gardens (Additional income types)
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Parking', 'Additional Services', 'Monthly parking space rental', 150),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Parking', 'Additional Services', 'Monthly parking space rental', 150),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Parking', 'Additional Services', 'Monthly parking space rental', 150),
  
  -- 15 Crescent Road (Additional income types)
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Storage', 'Additional Services', 'Storage unit rental', 100),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Storage', 'Additional Services', 'Storage unit rental', 100),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Storage', 'Additional Services', 'Storage unit rental', 100),
  
  -- 42 Harley Street (Additional income types)
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Parking', 'Additional Services', 'Monthly parking space rental', 200),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Parking', 'Additional Services', 'Monthly parking space rental', 200),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Parking', 'Additional Services', 'Monthly parking space rental', 200);

-- Add more detailed expense records
INSERT INTO expenses (id, property_id, date, expense_type, category, description, amount)
VALUES
  -- 8 Victoria Gardens (Additional expense types)
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 120),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 120),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 120),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'Utilities', 'Electricity', 'Common area electricity', 75),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'Utilities', 'Electricity', 'Common area electricity', 80),
  (gen_random_uuid(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'Utilities', 'Electricity', 'Common area electricity', 85),
  
  -- 15 Crescent Road (Additional expense types)
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 150),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 150),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 150),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'Utilities', 'Water', 'Water and sewerage', 45),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'Utilities', 'Water', 'Water and sewerage', 48),
  (gen_random_uuid(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'Utilities', 'Water', 'Water and sewerage', 50),
  
  -- 42 Harley Street (Additional expense types)
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 200),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 200),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Insurance', 'Building Insurance', 'Monthly building insurance premium', 200),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'Service', 'Cleaning', 'Monthly cleaning service', 150),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'Service', 'Cleaning', 'Monthly cleaning service', 150),
  (gen_random_uuid(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'Service', 'Cleaning', 'Monthly cleaning service', 150);

-- Add more service charges
INSERT INTO service_charges (id, property_id, date, type, description, status, amount)
VALUES
  -- 8 Victoria Gardens
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'maintenance', 'Building maintenance and cleaning', 'active', 180),
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'maintenance', 'Building maintenance and cleaning', 'active', 180),
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'maintenance', 'Building maintenance and cleaning', 'active', 180),
  
  -- 15 Crescent Road
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'maintenance', 'Building maintenance and cleaning', 'active', 150),
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'maintenance', 'Building maintenance and cleaning', 'active', 150),
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'maintenance', 'Building maintenance and cleaning', 'active', 150),
  
  -- 42 Harley Street
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'maintenance', 'Building maintenance and cleaning', 'active', 220),
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'maintenance', 'Building maintenance and cleaning', 'active', 220),
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'maintenance', 'Building maintenance and cleaning', 'active', 220);

-- Add more invoices
INSERT INTO invoices (id, property_id, date, invoice_number, description, status, amount)
VALUES
  -- 8 Victoria Gardens
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '2 months', 'INV-2024-004', 'Plumbing repairs', 'paid', 350),
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE - INTERVAL '1 month', 'INV-2024-005', 'Electrical inspection', 'paid', 280),
  (uuid_generate_v4(), '7a2e1487-f17b-4ceb-b6d1-56934589025b', CURRENT_DATE, 'INV-2024-006', 'Window cleaning', 'pending', 120),
  
  -- 15 Crescent Road
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '2 months', 'INV-2024-007', 'Boiler service', 'paid', 180),
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE - INTERVAL '1 month', 'INV-2024-008', 'Garden maintenance', 'paid', 150),
  (uuid_generate_v4(), 'bd8e3211-2403-47ac-9947-7a4842c5a4e3', CURRENT_DATE, 'INV-2024-009', 'Pest control', 'pending', 200),
  
  -- 42 Harley Street
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '2 months', 'INV-2024-010', 'HVAC maintenance', 'paid', 450),
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE - INTERVAL '1 month', 'INV-2024-011', 'Security system upgrade', 'paid', 850),
  (uuid_generate_v4(), 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', CURRENT_DATE, 'INV-2024-012', 'Interior painting', 'pending', 1200);

-- ... existing code ... 