// Script to seed properties table with test data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service_role key if we have it
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log(`Connecting to Supabase at ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function seedProperties() {
  try {
    console.log('Starting properties seeding...');
    
    // Insert properties matching the actual schema
    console.log('Inserting test properties...');
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .upsert([
        {
          id: 'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
          property_code: 'prop_15_crescent_road',
          address: '15 Crescent Road',
          city: 'London',
          postcode: 'SW1 1AA',
          property_type: 'House',
          bedrooms: 3,
          bathrooms: 2,
          is_furnished: true,
          status: 'active',
          description: 'Beautiful house in London',
          user_id: '00000000-0000-0000-0000-000000000001'
        },
        {
          id: 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
          property_code: 'prop_42_harley_street',
          address: '42 Harley Street',
          city: 'London',
          postcode: 'W1G 9PL',
          property_type: 'Apartment',
          bedrooms: 2,
          bathrooms: 1,
          is_furnished: true,
          status: 'active',
          description: 'Modern apartment in Central London',
          user_id: '00000000-0000-0000-0000-000000000001'
        },
        {
          id: '7a2e1487-f17b-4ceb-b6d1-56934589025b',
          property_code: 'prop_8_victoria_gardens',
          address: '8 Victoria Gardens',
          city: 'Manchester',
          postcode: 'M1 6FQ',
          property_type: 'House',
          bedrooms: 4,
          bathrooms: 3,
          is_furnished: false,
          status: 'active',
          description: 'Spacious family home in Manchester',
          user_id: '00000000-0000-0000-0000-000000000001'
        }
      ]);
    
    if (propertiesError) {
      console.error('Error inserting properties:', propertiesError);
    } else {
      console.log('Properties inserted successfully', propertiesData);
    }
    
    console.log('Properties seeding completed!');
  } catch (error) {
    console.error('Error during properties seeding:', error);
  }
}

seedProperties(); 