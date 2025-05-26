/**
 * Script to populate test energy efficiency data for a property
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test property ID
const TEST_PROPERTY_ID = 'd2a69e47-b372-4b98-bb1e-717315e4001c';

// Sample energy efficiency data (based on PropertyData API structure)
const sampleEnergyData = {
  current_energy_rating: 'C',
  potential_energy_rating: 'B',
  current_energy_efficiency: 72,
  potential_energy_efficiency: 81,
  property_type: 'Flat',
  built_form: 'Mid-terrace',
  inspection_date: '2023-05-15',
  lodgement_date: '2023-05-20',
  transaction_type: 'marketed sale',
  environment_impact_current: 68,
  environment_impact_potential: 78,
  energy_consumption_current: 142,
  energy_consumption_potential: 98,
  co2_emissions_current: 2.1,
  co2_emissions_potential: 1.4,
  lighting_cost_current: 123,
  lighting_cost_potential: 87,
  heating_cost_current: 456,
  heating_cost_potential: 312,
  hot_water_cost_current: 234,
  hot_water_cost_potential: 167,
  total_floor_area: 65,
  energy_tariff: 'Single rate',
  mains_gas_flag: 'Y',
  floor_level: 2,
  flat_top_storey: 'N',
  flat_storey_count: 4,
  main_heating_controls: 'Programmer, room thermostat and TRVs',
  multi_glaze_proportion: 100,
  glazed_type: 'double glazing',
  glazed_area: 'Normal',
  extension_count: 0,
  number_habitable_rooms: 3,
  number_heated_rooms: 3,
  low_energy_lighting: 100,
  number_open_fireplaces: 0,
  hotwater_description: 'From main system',
  hot_water_energy_eff: 'Good',
  hot_water_env_eff: 'Good',
  floor_description: 'Suspended, no insulation (assumed)',
  floor_energy_eff: 'N/A',
  floor_env_eff: 'N/A',
  windows_description: 'Fully double glazed',
  windows_energy_eff: 'Good',
  windows_env_eff: 'Good',
  walls_description: 'Cavity wall, as built, no insulation (assumed)',
  walls_energy_eff: 'Average',
  walls_env_eff: 'Average',
  secondheat_description: 'None',
  roof_description: 'Flat, no insulation (assumed)',
  roof_energy_eff: 'Very Poor',
  roof_env_eff: 'Very Poor',
  mainheat_description: 'Boiler and radiators, mains gas',
  mainheat_energy_eff: 'Good',
  mainheat_env_eff: 'Good',
  mainheatcont_description: 'Programmer, room thermostat and TRVs',
  mainheatcont_energy_eff: 'Good',
  mainheatcont_env_eff: 'Good',
  lighting_description: 'Low energy lighting in all fixed outlets',
  lighting_energy_eff: 'Very Good',
  lighting_env_eff: 'Very Good',
  main_fuel: 'mains gas',
  wind_turbine_count: 0,
  heat_loss_corridor: 'no corridor',
  unheated_corridor_length: 0,
  floor_height: 2.4,
  photo_supply: 0,
  solar_water_heating_flag: 'N',
  mechanical_ventilation: 'natural',
  address: '53 Fairlie House, Leyton, London E17 7GA',
  local_authority: 'Waltham Forest',
  constituency: 'Leyton and Wanstead',
  county: 'Greater London',
  lodgement_datetime: '2023-05-20 14:30:00',
  tenure: 'Owner-occupied',
  property_age_band: '1967-1975',
  current_energy_rating_band: 'C',
  potential_energy_rating_band: 'B'
};

async function populateTestEnergyData() {
  console.log('🔋 Populating Test Energy Efficiency Data');
  console.log('=' .repeat(50));
  
  try {
    // First, check if the property exists
    console.log('\n1. Checking if test property exists...');
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address, postcode')
      .eq('id', TEST_PROPERTY_ID)
      .single();
    
    if (propertyError) {
      console.error('❌ Test property not found:', propertyError.message);
      return false;
    }
    
    console.log('✅ Property found:', property.address);
    
    // Check if energy data already exists
    console.log('\n2. Checking for existing energy data...');
    const { data: existingData, error: existingError } = await supabase
      .from('property_enrichment_data')
      .select('id')
      .eq('property_id', TEST_PROPERTY_ID)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (existingData) {
      console.log('⚠️  Energy data already exists. Updating...');
      
      // Update existing record
      const { error: updateError } = await supabase
        .from('property_enrichment_data')
        .update({
          data: sampleEnergyData,
          source: 'Test Data',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
      
      if (updateError) {
        console.error('❌ Failed to update energy data:', updateError.message);
        return false;
      }
      
      console.log('✅ Energy data updated successfully');
    } else {
      console.log('📝 No existing energy data found. Creating new record...');
      
      // Insert new record
      const { error: insertError } = await supabase
        .from('property_enrichment_data')
        .insert({
          property_id: TEST_PROPERTY_ID,
          data_type: 'energy_efficiency',
          data: sampleEnergyData,
          source: 'Test Data',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to insert energy data:', insertError.message);
        return false;
      }
      
      console.log('✅ Energy data inserted successfully');
    }
    
    // Verify the data was saved
    console.log('\n3. Verifying saved data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('property_enrichment_data')
      .select('data')
      .eq('property_id', TEST_PROPERTY_ID)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify data:', verifyError.message);
      return false;
    }
    
    console.log('✅ Data verification successful');
    console.log('   Energy Rating:', verifyData.data.current_energy_rating);
    console.log('   Energy Efficiency:', verifyData.data.current_energy_efficiency);
    console.log('   Environmental Impact:', verifyData.data.environment_impact_current);
    
    return true;
  } catch (error) {
    console.error('❌ Error populating test data:', error.message);
    return false;
  }
}

// Run the script
populateTestEnergyData()
  .then(success => {
    if (success) {
      console.log('\n🎉 Test energy data populated successfully!');
      console.log('You can now test the property details page to see the real energy data.');
    } else {
      console.log('\n❌ Failed to populate test energy data');
    }
  })
  .catch(console.error); 