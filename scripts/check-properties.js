/**
 * Script to check what properties exist in the database
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

async function checkProperties() {
  console.log('🏠 Checking Available Properties');
  console.log('=' .repeat(40));
  
  try {
    // Get all properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching properties:', error.message);
      return;
    }
    
    if (!properties || properties.length === 0) {
      console.log('⚠️  No properties found in database');
      return;
    }
    
    console.log(`✅ Found ${properties.length} properties:`);
    console.log('');
    
    // Show the structure of the first property
    if (properties.length > 0) {
      console.log('Property table structure:');
      console.log('Columns:', Object.keys(properties[0]));
      console.log('');
    }
    
    properties.forEach((property, index) => {
      console.log(`${index + 1}. Property ID: ${property.id}`);
      console.log(`   Address: ${property.address || 'No address'}`);
      console.log(`   City: ${property.city || 'No city'}`);
      console.log(`   Postcode: ${property.postcode || 'No postcode'}`);
      console.log('');
    });
    
    // Check if our test property ID exists
    const testPropertyId = 'd2a69e47-b372-4b98-bb1e-717315e4001c';
    const testProperty = properties.find(p => p.id === testPropertyId);
    
    if (testProperty) {
      console.log('✅ Test property found!');
    } else {
      console.log('⚠️  Test property ID not found. Using first available property...');
      if (properties.length > 0) {
        console.log(`Suggested property ID: ${properties[0].id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
checkProperties(); 