const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Checking calendar_events table data...');
    
    // Get all events
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    console.log(`Found ${events.length} events in the calendar_events table`);
    
    // Print out the events
    events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`  ID: ${event.id}`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Date: ${event.date}`);
      console.log(`  Time: ${event.all_day ? 'All day' : `${event.start_time || ''} - ${event.end_time || ''}`}`);
      console.log(`  Location: ${event.location || 'N/A'}`);
      console.log(`  Type: ${event.event_type}`);
      console.log(`  Property: ${event.property_id || 'N/A'}`);
      console.log(`  Description: ${event.description || 'N/A'}`);
    });
    
    // Check if our helper functions exist
    console.log('\nChecking database functions...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_calendar_events_by_month', {
        p_user_id: '00000000-0000-0000-0000-000000000001',
        p_year: 2024,
        p_month: 3
      });
    
    if (functionsError) {
      console.error('Error calling get_calendar_events_by_month function:', functionsError);
    } else {
      console.log(`The get_calendar_events_by_month function returned ${functions.length} events for March 2024`);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main(); 