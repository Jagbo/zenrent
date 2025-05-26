const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking property_enrichment_data table structure...');
  
  try {
    // Try to query the table directly to see what columns exist
    console.log('1. Checking if table exists by querying it...');
    const { data: records, error: recordError } = await supabase
      .from('property_enrichment_data')
      .select('*')
      .limit(1);
      
    if (recordError) {
      console.error('❌ Error querying table:', recordError);
      
      // If table doesn't exist, let's check what tables do exist
      console.log('\n2. Checking what tables exist...');
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .like('tablename', '%enrichment%');
        
      if (tablesError) {
        console.error('❌ Error querying tables:', tablesError);
      } else {
        console.log('Tables with "enrichment" in name:', tables);
      }
      
      return;
    }
    
    console.log(`✅ Table exists! Found ${records?.length || 0} records`);
    
    if (records && records.length > 0) {
      console.log('✅ Sample record structure:');
      const sampleRecord = records[0];
      Object.keys(sampleRecord).forEach(key => {
        console.log(`  ${key}: ${typeof sampleRecord[key]} (${sampleRecord[key] === null ? 'null' : 'has value'})`);
      });
    } else {
      // Try to insert a test record to see what columns are expected
      console.log('\n3. Testing table structure by attempting insert...');
      const testData = {
        property_id: 'test-id',
        data_type: 'test',
        data: { test: true },
        source: 'test'
      };
      
      const { error: insertError } = await supabase
        .from('property_enrichment_data')
        .insert(testData);
        
      if (insertError) {
        console.log('Insert error (shows expected columns):', insertError.message);
      } else {
        console.log('✅ Test insert successful');
        // Clean up
        await supabase
          .from('property_enrichment_data')
          .delete()
          .eq('property_id', 'test-id');
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkTableStructure(); 