import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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
  
  // Get the current redirect URI from environment
  const redirectUri = process.env.HMRC_REDIRECT_URI;
  
  if (!redirectUri) {
    console.error('HMRC_REDIRECT_URI not found in environment variables');
    process.exit(1);
  }
  
  console.log(`Updating HMRC_REDIRECT_URI in database to: ${redirectUri}`);
  
  try {
    // Update the HMRC_REDIRECT_URI setting in the database
    const { data, error } = await supabase
      .from('settings')
      .update({ value: redirectUri })
      .eq('key', 'HMRC_REDIRECT_URI')
      .select();
    
    if (error) {
      console.error('Error updating HMRC_REDIRECT_URI:', error);
      process.exit(1);
    }
    
    console.log('Update successful!');
    console.log('Updated setting:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
