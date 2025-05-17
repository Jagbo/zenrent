-- Seed data for testing property issues

-- Insert test user
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
('00000000-0000-0000-0000-000000000001', 'j.agbodo@mail.com', '{"full_name": "James Agbodo"}')
ON CONFLICT (id) DO NOTHING;

-- Insert properties for the test user
INSERT INTO public.properties (id, name, address, city, state, property_type, user_id, property_code)
VALUES 
('bd8e3211-2403-47ac-9947-7a4842c5a4e3', '15 Crescent Road', '15 Crescent Road', 'London', 'England', 'House', '00000000-0000-0000-0000-000000000001', 'prop_15_crescent_road'),
('dfe98af6-7b35-4eb1-a75d-b9cb279d86d8', '42 Harley Street', '42 Harley Street', 'London', 'England', 'Apartment', '00000000-0000-0000-0000-000000000001', 'prop_42_harley_street'),
('7a2e1487-f17b-4ceb-b6d1-56934589025b', '8 Victoria Gardens', '8 Victoria Gardens', 'Manchester', 'England', 'House', '00000000-0000-0000-0000-000000000001', 'prop_8_victoria_gardens')
ON CONFLICT (id) DO NOTHING;

-- Insert issues for the properties
INSERT INTO public.issues (id, title, description, property_id, status, priority, type, reported_date, is_emergency)
VALUES 
('b7f456e8-240c-48d8-b9b4-26f22254f91b', 'Water leak in bathroom ceiling', 'Water dripping from the bathroom ceiling, possibly from upstairs plumbing.', 'prop_15_crescent_road', 'Todo', 'High', 'Bug', NOW(), true),
('e934d52a-45aa-441c-8c78-725dfceb2468', 'Broken heating system', 'Heating not working throughout the property. Thermostat shows error code E4.', 'prop_42_harley_street', 'In Progress', 'High', 'Bug', NOW(), false),
('89799523-7143-4ac0-ade5-72c897e126d2', 'Mailbox key replacement', 'Tenant lost mailbox key and needs a replacement.', 'prop_15_crescent_road', 'Todo', 'Low', 'Feature', NOW(), false),
('a3aa8cc2-12da-4ad5-a0f1-fbafc0480c6b', 'Noisy neighbors complaint', 'Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.', 'prop_8_victoria_gardens', 'Todo', 'Medium', 'Bug', NOW(), false),
('bffbeca2-3d5b-44ac-a1fd-3a23a263a853', 'Parking spot dispute', 'Tenant claims another resident is using their assigned parking spot regularly.', 'prop_42_harley_street', 'Done', 'Medium', 'Documentation', NOW(), false)
ON CONFLICT (id) DO NOTHING;

-- Insert RLS policies to allow access to the test user's data
-- This assumes public.auth_users_view already exists (Supabase default)
BEGIN;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Create new policies
CREATE POLICY "Users can view their own properties"
  ON public.properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON public.properties
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON public.properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Issues policies
DROP POLICY IF EXISTS "Users can view their own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can insert their own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON public.issues;

-- Create new policies for issues
CREATE POLICY "Users can view their own issues"
  ON public.issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.property_code = issues.property_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own issues"
  ON public.issues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.property_code = issues.property_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own issues"
  ON public.issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.property_code = issues.property_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own issues"
  ON public.issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      WHERE p.property_code = issues.property_id
      AND p.user_id = auth.uid()
    )
  );
COMMIT; 