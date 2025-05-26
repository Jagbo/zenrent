/**
 * Script to create a test property and populate it with energy data
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

// Test property data
const TEST_PROPERTY_ID = 'd2a69e47-b372-4b98-bb1e-717315e4001c';

const testProperty = {
  id: TEST_PROPERTY_ID,
  user_id: '3d262808-31db-41fe-b352-acb56f61b013', // Test user ID from seed data
  property_code: 'prop_test_fairlie_house',
  address: '53 Fairlie House, Leyton',
  city: 'London',
  postcode: 'E17 7GA',
  property_type: 'flat',
  bedrooms: 2,
  bathrooms: 1,
  is_furnished: true,
  purchase_date: '2020-01-15',
  purchase_price: 280000,
  current_valuation: 320000,
  description: 'Modern 2-bedroom flat in Leyton with good transport links',
  status: 'active',
  photo_url: '/images/default/property-placeholder.jpg',
  energy_rating: 'C',
  council_tax_band: 'D',
  has_garden: false,
  has_parking: false,
  gas_safety_expiry: '2024-12-31',
  electrical_safety_expiry: '2025-06-30',
  notes: 'Test property for energy efficiency data integration',
  metadata: {
    amenities: ['Central Heating', 'Double Glazing', 'Communal Garden'],
    year_built: 1970,
    square_footage: 700
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Sample energy efficiency data
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

async function createTestPropertyAndData() {
  console.log('🏠 Creating Test Property and Energy Data');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Create the test property
    console.log('\n1. Creating test property...');
    
    // Check if property already exists
    const { data: existingProperty, error: checkError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', TEST_PROPERTY_ID)
      .single();
    
    if (existingProperty) {
      console.log('✅ Test property already exists');
    } else {
      // Create the property
      const { error: propertyError } = await supabase
        .from('properties')
        .insert(testProperty);
      
      if (propertyError) {
        console.error('❌ Failed to create property:', propertyError.message);
        return false;
      }
      
      console.log('✅ Test property created successfully');
    }
    
    // Step 2: Add energy efficiency data
    console.log('\n2. Adding energy efficiency data...');
    
    // Check if energy data already exists
    const { data: existingEnergyData, error: energyCheckError } = await supabase
      .from('property_enrichment_data')
      .select('id')
      .eq('property_id', TEST_PROPERTY_ID)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (existingEnergyData) {
      console.log('⚠️  Energy data already exists. Updating...');
      
      // Update existing record
      const { error: updateError } = await supabase
        .from('property_enrichment_data')
        .update({
          data: sampleEnergyData,
          source: 'Test Data',
          last_updated: new Date().toISOString(),
          next_update_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', existingEnergyData.id);
      
      if (updateError) {
        console.error('❌ Failed to update energy data:', updateError.message);
        return false;
      }
      
      console.log('✅ Energy data updated successfully');
    } else {
      console.log('📝 Creating new energy data record...');
      
      // Insert new record
      const { error: insertError } = await supabase
        .from('property_enrichment_data')
        .insert({
          property_id: TEST_PROPERTY_ID,
          data_type: 'energy_efficiency',
          data: sampleEnergyData,
          source: 'Test Data',
          last_updated: new Date().toISOString(),
          next_update_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to insert energy data:', insertError.message);
        return false;
      }
      
      console.log('✅ Energy data inserted successfully');
    }
    
    // Step 3: Verify everything was created
    console.log('\n3. Verifying test data...');
    
    // Verify property
    const { data: verifyProperty, error: verifyPropertyError } = await supabase
      .from('properties')
      .select('id, address, postcode')
      .eq('id', TEST_PROPERTY_ID)
      .single();
    
    if (verifyPropertyError) {
      console.error('❌ Failed to verify property:', verifyPropertyError.message);
      return false;
    }
    
    // Verify energy data
    const { data: verifyEnergyData, error: verifyEnergyError } = await supabase
      .from('property_enrichment_data')
      .select('data')
      .eq('property_id', TEST_PROPERTY_ID)
      .eq('data_type', 'energy_efficiency')
      .single();
    
    if (verifyEnergyError) {
      console.error('❌ Failed to verify energy data:', verifyEnergyError.message);
      return false;
    }
    
    console.log('✅ Verification successful!');
    console.log('   Property:', verifyProperty.address);
    console.log('   Postcode:', verifyProperty.postcode);
    console.log('   Energy Rating:', verifyEnergyData.data.current_energy_rating);
    console.log('   Energy Efficiency:', verifyEnergyData.data.current_energy_efficiency);
    console.log('   Environmental Impact:', verifyEnergyData.data.environment_impact_current);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    return false;
  }
}

// Run the script
createTestPropertyAndData()
  .then(success => {
    if (success) {
      console.log('\n🎉 Test property and energy data created successfully!');
      console.log(`Property ID: ${TEST_PROPERTY_ID}`);
      console.log('You can now test the property details page at:');
      console.log(`http://localhost:3000/properties/${TEST_PROPERTY_ID}`);
    } else {
      console.log('\n❌ Failed to create test data');
    }
  })
  .catch(console.error); 