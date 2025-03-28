-- Seed data for calendar_events table
-- Using test user ID: 00000000-0000-0000-0000-000000000001

-- Clear existing data first
DELETE FROM calendar_events;

-- Seed with sample calendar events
INSERT INTO calendar_events (
  id,
  user_id,
  title,
  date,
  start_time,
  end_time,
  all_day,
  location,
  event_type,
  property_id,
  description,
  created_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    '00000000-0000-0000-0000-000000000001',
    'Property Inspection',
    '2024-03-01',
    '10:00',
    '11:00',
    FALSE,
    'Sunset Apartments Room 204',
    'inspection',
    'PROP001',
    'Quarterly inspection of property conditions and tenant compliance',
    '2024-02-15 09:30:00'
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    '00000000-0000-0000-0000-000000000001',
    'Rent Due',
    '2024-03-04',
    NULL,
    NULL,
    TRUE,
    'All properties',
    'payment',
    NULL,
    'Monthly rent collection date for all properties',
    '2024-02-20 14:15:00'
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    '00000000-0000-0000-0000-000000000001',
    'Maintenance Visit',
    '2024-03-08',
    '14:00',
    '16:00',
    FALSE,
    'Oakwood Heights Room 103',
    'maintenance',
    'PROP002',
    'Plumber scheduled to fix leaking bathroom faucet',
    '2024-03-01 11:45:00'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    '00000000-0000-0000-0000-000000000001',
    'Tenant Meeting',
    '2024-03-12',
    '15:00',
    '15:30',
    FALSE,
    'Parkview Residences Room 305',
    'meeting',
    'PROP003',
    'Meeting with tenant to discuss lease renewal options',
    '2024-03-05 16:30:00'
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    '00000000-0000-0000-0000-000000000001',
    'Property Showing',
    '2024-03-15',
    '11:00',
    '12:00',
    FALSE,
    'Sunset Apartments Room 112',
    'showing',
    'PROP001',
    'Property showing for potential new tenants',
    '2024-03-08 10:00:00'
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    '00000000-0000-0000-0000-000000000001',
    'Lease Signing',
    '2024-03-18',
    '10:00',
    '11:00',
    FALSE,
    'Main Office',
    'contract',
    'PROP004',
    'New tenant lease signing appointment',
    '2024-03-10 09:15:00'
  ),
  (
    '11111111-1111-1111-1111-111111111107',
    '00000000-0000-0000-0000-000000000001',
    'Contractor Meeting',
    '2024-03-22',
    '09:00',
    '10:00',
    FALSE,
    'Oakwood Heights',
    'maintenance',
    'PROP002',
    'Meeting with contractors to discuss renovation plans',
    '2024-03-15 13:20:00'
  ),
  (
    '11111111-1111-1111-1111-111111111108',
    '00000000-0000-0000-0000-000000000001',
    'Monthly Report Due',
    '2024-03-31',
    NULL,
    NULL,
    TRUE,
    'N/A',
    'admin',
    NULL,
    'Deadline for preparing monthly property management reports',
    '2024-03-20 08:45:00'
  ),
  -- Add upcoming events for the current month/year
  (
    '11111111-1111-1111-1111-111111111109',
    '00000000-0000-0000-0000-000000000001',
    'Gas Safety Certificate Renewal',
    CURRENT_DATE + INTERVAL '5 days',
    '09:30',
    '11:30',
    FALSE,
    'Parkview Residences Room 305',
    'inspection',
    'PROP003',
    'Annual gas safety certificate inspection and renewal',
    NOW() - INTERVAL '7 days'
  ),
  (
    '11111111-1111-1111-1111-111111111110',
    '00000000-0000-0000-0000-000000000001',
    'Rent Due',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days',
    NULL,
    NULL,
    TRUE,
    'All properties',
    'payment',
    NULL,
    'Monthly rent collection date for all properties',
    NOW() - INTERVAL '10 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Quarterly Financial Review',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '15 days',
    '14:00',
    '16:00',
    FALSE,
    'Main Office',
    'admin',
    NULL,
    'Review of financial performance for all properties',
    NOW() - INTERVAL '5 days'
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    '00000000-0000-0000-0000-000000000001',
    'Tenant Meeting - Lease Renewal',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '12 days',
    '13:00',
    '13:30',
    FALSE,
    'Sunset Apartments Room 204',
    'meeting',
    'PROP001',
    'Discussion with tenant about lease renewal terms',
    NOW() - INTERVAL '3 days'
  );

-- Insert some recurring events for the future
INSERT INTO calendar_events (
  user_id,
  title,
  date,
  start_time,
  end_time,
  all_day,
  location,
  event_type,
  property_id,
  description
)
SELECT 
  '00000000-0000-0000-0000-000000000001' as user_id,
  'Property Inspection' as title,
  (CURRENT_DATE + (i || ' months')::INTERVAL) as date,
  '10:00' as start_time,
  '12:00' as end_time,
  FALSE as all_day,
  'All Properties' as location,
  'inspection' as event_type,
  NULL as property_id,
  'Regular quarterly property inspection for all properties' as description
FROM generate_series(1, 4) as i
WHERE i % 3 = 0; -- Every 3 months

-- Insert monthly rent due events for the future
INSERT INTO calendar_events (
  user_id,
  title,
  date,
  all_day,
  location,
  event_type,
  description
)
SELECT 
  '00000000-0000-0000-0000-000000000001' as user_id,
  'Rent Due' as title,
  (DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL + '4 days'::INTERVAL) as date,
  TRUE as all_day,
  'All Properties' as location,
  'payment' as event_type,
  'Monthly rent collection date for all properties' as description
FROM generate_series(1, 6) as i; 