const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEnergyData() {
  console.log('🔍 Testing energy data directly from database...');
  
  try {
    // Test the same query that getPropertyEnergyDataClient uses
    const { data, error } = await supabase
      .from('property_enrichment_data')
      .select('data')
      .eq('property_id', 'd2a69e47-b372-4b98-bb1e-717315e4001c')
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (error) {
      console.log('❌ No energy data found:', error.message);
      return;
    }
    
    console.log('✅ Energy data found:', JSON.stringify(data?.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEnergyData(); 