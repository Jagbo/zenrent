import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  } else {
    console.warn('No .env.local file found');
  }
}

// Generate a random code verifier for PKCE
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function main() {
  // Load environment variables
  loadEnv();
  
  // Create Supabase client using environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get user ID from command line or use a test ID
  const userId = process.argv[2] || 'fd98eb7b-e2a1-488b-a669-d34c914202b1';
  const codeVerifier = generateCodeVerifier();
  
  console.log(`Testing HMRC code verifier storage and retrieval for user: ${userId}`);
  console.log(`Generated code verifier: ${codeVerifier}`);
  
  try {
    // Store code verifier in the database
    console.log('Storing code verifier in the database...');
    
    // Generate a state parameter (in the real app, this includes the user ID)
    const state = `${userId}:${Math.random().toString(36).substring(2, 12)}`;
    console.log(`Generated state parameter: ${state}`);
    
    const { error: insertError } = await supabase
      .from('hmrc_auth_requests')
      .upsert({
        user_id: userId,
        code_verifier: codeVerifier,
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error storing code verifier:', insertError);
      process.exit(1);
    }
    
    console.log('Code verifier stored successfully');
    
    // Retrieve code verifier from the database
    console.log('Retrieving code verifier from the database...');
    
    const { data, error: retrieveError } = await supabase
      .from('hmrc_auth_requests')
      .select('code_verifier')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving code verifier:', retrieveError);
      process.exit(1);
    }
    
    console.log('Retrieved code verifier:', data.code_verifier);
    console.log('Verification:', data.code_verifier === codeVerifier ? 'MATCH ✅' : 'MISMATCH ❌');
    
    // Check if the hmrc_auth_requests table has the correct structure
    console.log('\nChecking hmrc_auth_requests table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'hmrc_auth_requests' });
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
    } else {
      console.log('Table structure:', tableInfo);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
