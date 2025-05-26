/**
 * Simple test to check if the property_enrichment_data table is accessible
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnrichmentTable() {
  console.log('🧪 Testing Property Enrichment Table Access');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if table exists and is accessible
    console.log('\n1. Testing table access...');
    const { data, error } = await supabase
      .from('property_enrichment_data')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error.message);
      console.log('   This might mean:');
      console.log('   - Table doesn\'t exist');
      console.log('   - RLS policies are blocking access');
      console.log('   - User authentication required');
      return false;
    }
    
    console.log('✅ Table is accessible');
    console.log('   Records found:', data.length);
    if (data.length > 0) {
      console.log('   Sample record structure:', Object.keys(data[0]));
    }
    
    // Test 2: Try to access specific property data
    console.log('\n2. Testing property-specific access...');
    const testPropertyId = 'd2a69e47-b372-4b98-bb1e-717315e4001c';
    
    const { data: propertyData, error: propertyError } = await supabase
      .from('property_enrichment_data')
      .select('data')
      .eq('property_id', testPropertyId)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (propertyError) {
      console.log('⚠️  No energy data found for test property:', propertyError.message);
    } else {
      console.log('✅ Energy data found for test property');
      console.log('   Data keys:', Object.keys(propertyData.data || {}));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testEnrichmentTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Table access test completed successfully!');
    } else {
      console.log('\n❌ Table access test failed');
    }
  })
  .catch(console.error); 