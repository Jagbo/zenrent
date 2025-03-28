// Script to seed database with test data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service_role key if we have it
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log(`Connecting to Supabase at ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function seedData() {
  try {
    console.log('Starting database seeding...');
    
    // Insert test user
    console.log('Inserting test user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'j.agbodo@mail.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'James Agbodo' },
      id: '00000000-0000-0000-0000-000000000001'
    });
    
    if (userError) {
      console.error('Error inserting test user:', userError);
    } else {
      console.log('Test user inserted successfully');
    }
    
    // Insert properties for the test user
    console.log('Inserting test properties...');
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .upsert([
        {
          id: 'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
          name: '15 Crescent Road',
          address: '15 Crescent Road',
          city: 'London',
          state: 'England',
          property_type: 'House',
          user_id: '00000000-0000-0000-0000-000000000001',
          property_code: 'prop_15_crescent_road'
        },
        {
          id: 'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
          name: '42 Harley Street',
          address: '42 Harley Street',
          city: 'London',
          state: 'England',
          property_type: 'Apartment',
          user_id: '00000000-0000-0000-0000-000000000001',
          property_code: 'prop_42_harley_street'
        },
        {
          id: '7a2e1487-f17b-4ceb-b6d1-56934589025b',
          name: '8 Victoria Gardens',
          address: '8 Victoria Gardens',
          city: 'Manchester',
          state: 'England',
          property_type: 'House',
          user_id: '00000000-0000-0000-0000-000000000001',
          property_code: 'prop_8_victoria_gardens'
        }
      ]);
    
    if (propertiesError) {
      console.error('Error inserting properties:', propertiesError);
    } else {
      console.log('Properties inserted successfully');
    }
    
    // Insert issues for the properties
    console.log('Inserting test issues...');
    const { data: issuesData, error: issuesError } = await supabase
      .from('issues')
      .upsert([
        {
          id: 'b7f456e8-240c-48d8-b9b4-26f22254f91b',
          title: 'Water leak in bathroom ceiling',
          description: 'Water dripping from the bathroom ceiling, possibly from upstairs plumbing.',
          property_id: 'prop_15_crescent_road',
          status: 'Todo',
          priority: 'High',
          type: 'Bug',
          reported_date: new Date().toISOString(),
          is_emergency: true
        },
        {
          id: 'e934d52a-45aa-441c-8c78-725dfceb2468',
          title: 'Broken heating system',
          description: 'Heating not working throughout the property. Thermostat shows error code E4.',
          property_id: 'prop_42_harley_street',
          status: 'In Progress',
          priority: 'High',
          type: 'Bug',
          reported_date: new Date().toISOString(),
          is_emergency: false
        },
        {
          id: '89799523-7143-4ac0-ade5-72c897e126d2',
          title: 'Mailbox key replacement',
          description: 'Tenant lost mailbox key and needs a replacement.',
          property_id: 'prop_15_crescent_road',
          status: 'Todo',
          priority: 'Low',
          type: 'Feature',
          reported_date: new Date().toISOString(),
          is_emergency: false
        },
        {
          id: 'a3aa8cc2-12da-4ad5-a0f1-fbafc0480c6b',
          title: 'Noisy neighbors complaint',
          description: 'Tenant in unit 305 complaining about excessive noise from unit 306 during night hours.',
          property_id: 'prop_8_victoria_gardens',
          status: 'Todo',
          priority: 'Medium',
          type: 'Bug',
          reported_date: new Date().toISOString(),
          is_emergency: false
        },
        {
          id: 'bffbeca2-3d5b-44ac-a1fd-3a23a263a853',
          title: 'Parking spot dispute',
          description: 'Tenant claims another resident is using their assigned parking spot regularly.',
          property_id: 'prop_42_harley_street',
          status: 'Done',
          priority: 'Medium',
          type: 'Documentation',
          reported_date: new Date().toISOString(),
          is_emergency: false
        }
      ]);
    
    if (issuesError) {
      console.error('Error inserting issues:', issuesError);
    } else {
      console.log('Issues inserted successfully');
    }
    
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

seedData(); 