-- Create a user account
INSERT INTO auth.users (
  id, 
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  phone
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- fixed UUID for reference
  'j.agbodo@gmail.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Joshua Agbodo"}',
  false,
  '+44 7700 900123'
);

-- Insert notification types
INSERT INTO public.notification_types (name, category, description) VALUES 
('payment_received', 'rent', 'Notification for when a rent payment is received'), 
('upcoming_rent_due', 'rent', 'Notification for when rent is due in 5 days'),
('rent_due_today', 'rent', 'Notification for when rent is due today'),
('rent_overdue_initial', 'rent', 'Notification for when rent is 1 day overdue'),
('rent_overdue_escalation', 'rent', 'Notification for when rent is several days overdue'),
('partial_payment', 'rent', 'Notification for when a partial rent payment is received'),
('new_issue', 'maintenance', 'Notification for when a new maintenance issue is reported'),
('urgent_issue', 'maintenance', 'Notification for when an urgent maintenance issue is reported'),
('issue_status_update', 'maintenance', 'Notification for when a maintenance issue status is updated'),
('issue_resolution', 'maintenance', 'Notification for when a maintenance issue is resolved'),
('quote_received', 'maintenance', 'Notification for when a quote is received for a maintenance issue'),
('maintenance_scheduled', 'maintenance', 'Notification for when maintenance work is scheduled'),
('invoice_received', 'financial', 'Notification for when an invoice is received'),
('upcoming_payment', 'financial', 'Notification for when a regular payment is due soon'),
('service_charge_update', 'financial', 'Notification for when a service charge is updated'),
('annual_return_reminder', 'financial', 'Notification for when a tax return is due soon'),
('lease_expiry', 'tenancy', 'Notification for when a lease is expiring soon'),
('new_tenant_application', 'tenancy', 'Notification for when a new tenant application is received'),
('tenant_notice', 'tenancy', 'Notification for when a tenant gives notice to vacate'),
('inspection_due', 'tenancy', 'Notification for when a property inspection is due'),
('certificate_expiring', 'compliance', 'Notification for when a certificate is expiring soon'),
('compliance_breach', 'compliance', 'Notification for when there is a compliance breach risk'),
('deposit_protection', 'compliance', 'Notification for when a tenant deposit needs to be protected'),
('vacancy_alert', 'property', 'Notification for when a property has been vacant for a while'),
('rent_increase', 'property', 'Notification for a potential rent increase opportunity'),
('property_performance', 'property', 'Monthly property performance summary notification'),
('portfolio_performance', 'property', 'Notification about portfolio performance issues');

-- Create bank connections and transactions
INSERT INTO public.bank_connections (id, property_id, plaid_access_token, plaid_item_id, cursor, created_at)
VALUES 
(1, 'prop_15_crescent_road', 'access-sandbox-123456789', 'item-sandbox-123456789', 'cursor-123456789', NOW() - INTERVAL '30 days'),
(2, 'prop_42_harley_street', 'access-sandbox-987654321', 'item-sandbox-987654321', 'cursor-987654321', NOW() - INTERVAL '25 days'),
(3, 'prop_8_victoria_gardens', 'access-sandbox-456789123', 'item-sandbox-456789123', 'cursor-456789123', NOW() - INTERVAL '20 days');

-- Create bank transactions for the properties
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

-- Create sample UK properties
-- Property 1 details 
DO $$
DECLARE
  user_id UUID := '00000000-0000-0000-0000-000000000001';
  property1_id UUID := gen_random_uuid();
  property2_id UUID := gen_random_uuid();
  property3_id UUID := gen_random_uuid();
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