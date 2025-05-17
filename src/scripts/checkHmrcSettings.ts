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
  
  console.log('Checking HMRC settings in database...');
  
  try {
    // Query the settings table for HMRC-related settings
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .or('key.ilike.%hmrc%,key.ilike.%oauth%');
    
    if (error) {
      console.error('Error querying settings:', error);
      process.exit(1);
    }
    
    console.log('HMRC settings found in database:');
    console.log(JSON.stringify(settings, null, 2));
    
    // Check if there's a redirect URI setting
    const redirectUriSetting = settings?.find(s => s.key === 'HMRC_REDIRECT_URI');
    if (redirectUriSetting) {
      console.log('\nFound HMRC_REDIRECT_URI in database:', redirectUriSetting.value);
      console.log('Environment HMRC_REDIRECT_URI:', process.env.HMRC_REDIRECT_URI);
    } else {
      console.log('\nNo HMRC_REDIRECT_URI found in database');
      console.log('Environment HMRC_REDIRECT_URI:', process.env.HMRC_REDIRECT_URI);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
