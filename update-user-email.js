// Script to update test user email in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key for admin operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

console.log(`Connecting to Supabase at ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateUserEmail() {
  try {
    console.log('Updating test user email...');
    
    // Update test user email
    const { data, error } = await supabase.auth.admin.updateUserById(
      '00000000-0000-0000-0000-000000000001',
      { email: 'j.agbodo@gmail.com' }
    );
    
    if (error) {
      console.error('Error updating user email:', error);
    } else {
      console.log('User email updated successfully:', data);
    }
  } catch (error) {
    console.error('Error updating user email:', error);
  }
}

updateUserEmail(); 