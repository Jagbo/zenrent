// Script to generate a password reset token for a user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address as argument');
  process.exit(1);
}

// Use local Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Get redirect URL
const redirectUrl = process.argv[3] || 'http://localhost:3000/reset-password';

// Create the Supabase client with service role key
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Also create a regular client
const client = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function generateResetToken() {
  try {
    console.log(`Generating reset token for: ${email}`);
    
    // Try approach 1: Use admin generate link
    try {
      console.log('Approach 1: Using admin.generateLink');
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) {
        console.error('Error with admin.generateLink:', error);
      } else if (data && data.properties && data.properties.action_link) {
        console.log('Success! Reset link generated:');
        console.log(data.properties.action_link);
        return;
      }
    } catch (err) {
      console.error('Exception in admin.generateLink:', err);
    }
    
    // Try approach 2: Use regular resetPasswordForEmail
    try {
      console.log('\nApproach 2: Using resetPasswordForEmail');
      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('Error with resetPasswordForEmail:', error);
      } else {
        console.log('Success! Reset email should be sent via Supabase');
        console.log('Check logs for the reset URL');
      }
    } catch (err) {
      console.error('Exception in resetPasswordForEmail:', err);
    }
    
    // Try approach 3: Direct SQL to get the user ID
    try {
      console.log('\nApproach 3: Direct SQL check');
      // We'll just use this to confirm the user exists
      console.log('Run this command to check the user:');
      console.log(`docker exec supabase_db_propbot psql -U postgres -c "SELECT id, email FROM auth.users WHERE email = '${email}'"`);
    } catch (err) {
      console.error('Exception in SQL check:', err);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateResetToken(); 