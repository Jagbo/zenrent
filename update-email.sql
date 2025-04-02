-- Update the email for our test user
UPDATE auth.users 
SET 
  email = 'j.agbodo@gmail.com',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT id, email, updated_at FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'; 