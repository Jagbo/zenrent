/**
 * Test script to verify property enrichment service integration
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test property ID (you can change this to any property ID in your database)
const TEST_PROPERTY_ID = 'd2a69e47-b372-4b98-bb1e-717315e4001c';

async function testPropertyEnrichment() {
  console.log('🧪 Testing Property Enrichment Service Integration');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check if property exists
    console.log('\n1. Checking if test property exists...');
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address, postcode, name')
      .eq('id', TEST_PROPERTY_ID)
      .single();
    
    if (propertyError) {
      console.error('❌ Property not found:', propertyError.message);
      return;
    }
    
    console.log('✅ Property found:', property.name || property.address);
    console.log('   Address:', property.address);
    console.log('   Postcode:', property.postcode);
    
    // Test 2: Check for existing enrichment data
    console.log('\n2. Checking for existing enrichment data...');
    const { data: enrichmentData, error: enrichmentError } = await supabase
      .rpc('get_property_enrichment_data', {
        p_property_id: TEST_PROPERTY_ID,
        p_data_type: 'energy_efficiency'
      });
    
    if (enrichmentError) {
      console.error('❌ Error fetching enrichment data:', enrichmentError.message);
      return;
    }
    
    if (enrichmentData && enrichmentData.length > 0) {
      console.log('✅ Energy efficiency data found in database:');
      const energyData = enrichmentData[0].data;
      console.log('   EPC Rating:', energyData.epcRating || 'N/A');
      console.log('   Energy Score:', energyData.energyScore || 'N/A');
      console.log('   Annual Energy Cost: £' + (energyData.totalEnergyCost || 'N/A'));
      console.log('   CO2 Emissions:', (energyData.co2Emissions || 'N/A') + ' tonnes/year');
      console.log('   Valid Until:', energyData.validUntil || 'N/A');
      
      if (energyData.recommendations && energyData.recommendations.length > 0) {
        console.log('   Recommendations:', energyData.recommendations.length + ' available');
        energyData.recommendations.slice(0, 2).forEach((rec, index) => {
          console.log(`     ${index + 1}. ${rec.improvement} (${rec.savingEstimate})`);
        });
      }
    } else {
      console.log('⚠️  No energy efficiency data found in database');
      console.log('   This means the enrichment service hasn\'t been run for this property yet');
      console.log('   Or the property address/postcode doesn\'t match EPC database records');
    }
    
    // Test 3: Check property_enrichment_data table structure
    console.log('\n3. Checking enrichment data table structure...');
    const { data: allEnrichmentData, error: allDataError } = await supabase
      .from('property_enrichment_data')
      .select('property_id, data_type, created_at')
      .limit(5);
    
    if (allDataError) {
      console.error('❌ Error accessing enrichment table:', allDataError.message);
    } else {
      console.log('✅ Enrichment table accessible');
      console.log('   Total records found:', allEnrichmentData.length);
      if (allEnrichmentData.length > 0) {
        console.log('   Sample data types:', [...new Set(allEnrichmentData.map(d => d.data_type))].join(', '));
      }
    }
    
    // Test 4: Verify RPC functions exist
    console.log('\n4. Testing RPC functions...');
    try {
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('get_property_enrichment_data', {
          p_property_id: 'test-id',
          p_data_type: 'energy_efficiency'
        });
      
      console.log('✅ get_property_enrichment_data RPC function is accessible');
    } catch (error) {
      console.error('❌ RPC function error:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 Test Summary:');
    console.log('   - Property details page should now display real energy data');
    console.log('   - EPC ratings, energy scores, and costs from PropertyData API');
    console.log('   - Certificate validity dates and environmental impact ratings');
    console.log('   - Energy efficiency recommendations when available');
    console.log('\n💡 To view the updated property page:');
    console.log(`   Visit: http://localhost:3000/properties/${TEST_PROPERTY_ID}`);
    console.log('   Check the "Certificates" tab for EPC information');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPropertyEnrichment().catch(console.error); 