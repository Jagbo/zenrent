require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment variables:');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Found (not showing for security)' : 'Missing');

// Check if required variables are present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = 'j.agbodo@gmail.com';
const redirectUrl = 'http://localhost:3005/reset-password';

async function testResetPassword() {
  try {
    console.log(`Attempting to send reset email to: ${email}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    console.log('Result:', { data, error });
    
    if (error) {
      console.error('Error generating reset token:', error);
    } else {
      console.log('Password reset token generated successfully');
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

testResetPassword(); 