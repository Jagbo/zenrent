const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Attempting to seed calendar_events table...');
    
    // Try to fetch a single record from the calendar_events table
    // This will tell us if the table exists
    const { data: testData, error: testError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.error('The calendar_events table does not exist!');
      return;
    } else if (testError) {
      console.error('Error checking table:', testError);
      return;
    }
    
    console.log('The calendar_events table exists. Proceeding with seeding...');
    
    // First clear existing data
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      return;
    }
    
    console.log('Cleared existing data from calendar_events table');
    
    // Basic seed data (simpler than the full SQL version)
    const seedData = [
      {
        id: '11111111-1111-1111-1111-111111111101',
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Property Inspection',
        date: '2024-03-01',
        start_time: '10:00',
        end_time: '11:00',
        all_day: false,
        location: 'Sunset Apartments Room 204',
        event_type: 'inspection',
        property_id: 'PROP001',
        description: 'Quarterly inspection of property conditions and tenant compliance'
      },
      {
        id: '11111111-1111-1111-1111-111111111102',
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Rent Due',
        date: '2024-03-04',
        all_day: true,
        location: 'All properties',
        event_type: 'payment',
        description: 'Monthly rent collection date for all properties'
      },
      {
        id: '11111111-1111-1111-1111-111111111103',
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Maintenance Visit',
        date: '2024-03-08',
        start_time: '14:00',
        end_time: '16:00',
        all_day: false,
        location: 'Oakwood Heights Room 103',
        event_type: 'maintenance',
        property_id: 'PROP002',
        description: 'Plumber scheduled to fix leaking bathroom faucet'
      }
    ];
    
    // Insert seed data
    const { error: insertError } = await supabase
      .from('calendar_events')
      .insert(seedData);
    
    if (insertError) {
      console.error('Error inserting seed data:', insertError);
      return;
    }
    
    console.log('Successfully seeded calendar_events table with sample data');
    
    // Add some future events
    const now = new Date();
    const futureData = [
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Gas Safety Certificate Renewal',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString().split('T')[0],
        start_time: '09:30',
        end_time: '11:30',
        all_day: false,
        location: 'Parkview Residences',
        event_type: 'inspection',
        property_id: 'PROP003',
        description: 'Annual gas safety certificate inspection and renewal'
      },
      {
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Rent Due',
        date: new Date(now.getFullYear(), now.getMonth() + 1, 4).toISOString().split('T')[0],
        all_day: true,
        location: 'All Properties',
        event_type: 'payment',
        description: 'Monthly rent collection date for all properties'
      }
    ];
    
    const { error: futureInsertError } = await supabase
      .from('calendar_events')
      .insert(futureData);
    
    if (futureInsertError) {
      console.error('Error inserting future events:', futureInsertError);
      return;
    }
    
    console.log('Successfully added future events');
    
    // Check how many records we have now
    const { data: count, error: countError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Error counting records:', countError);
      return;
    }
    
    console.log(`Total calendar events in database: ${count.length}`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main(); 