import { createClient } from '@supabase/supabase-js';

/**
 * Debug script to test code verifier storage and retrieval
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/debug-code-verifier.ts
 */

async function main() {
  // Test user ID - replace with a real user ID from your system
  const testUserId = 'fd98eb7b-e2a1-488b-a669-d34c914202b1';
  
  // Create a test code verifier
  const testCodeVerifier = generateCodeVerifier();
  
  console.log('=== HMRC Auth Debug Tool ===');
  console.log(`Testing with user ID: ${testUserId}`);
  console.log(`Generated code verifier: ${testCodeVerifier}`);
  
  // Create Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or service role key');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });
  
  console.log('\n1. Storing code verifier...');
  try {
    // Store the code verifier
    const { data: storeData, error: storeError } = await supabase.rpc('store_code_verifier', {
      p_user_id: testUserId,
      p_code_verifier: testCodeVerifier,
      p_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    });
    
    if (storeError) {
      console.error('Error storing code verifier:', storeError);
    } else {
      console.log('Code verifier stored successfully');
      console.log('Store result:', storeData);
    }
  } catch (error) {
    console.error('Exception storing code verifier:', error);
  }
  
  console.log('\n2. Retrieving code verifier...');
  try {
    // Retrieve the code verifier
    const { data: retrieveData, error: retrieveError } = await supabase.rpc('get_code_verifier', {
      p_user_id: testUserId
    });
    
    if (retrieveError) {
      console.error('Error retrieving code verifier:', retrieveError);
    } else if (!retrieveData) {
      console.error('No code verifier found');
    } else {
      console.log('Code verifier retrieved successfully');
      console.log('Retrieved code verifier:', retrieveData);
      console.log('Matches original:', retrieveData === testCodeVerifier);
    }
  } catch (error) {
    console.error('Exception retrieving code verifier:', error);
  }
  
  console.log('\n3. Checking database directly...');
  try {
    // Check the database directly
    const { data: dbData, error: dbError } = await supabase
      .from('code_verifiers')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (dbError) {
      console.error('Error querying database:', dbError);
    } else if (!dbData) {
      console.error('No record found in database');
    } else {
      console.log('Database record found:');
      console.log(dbData);
    }
  } catch (error) {
    console.error('Exception querying database:', error);
  }
}

// Generate a random code verifier for PKCE
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(64);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
}

// Run the main function
main().catch(console.error);
