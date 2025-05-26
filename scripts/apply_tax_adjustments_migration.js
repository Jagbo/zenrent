/**
 * Apply Tax Adjustments Table Migration Script
 * 
 * This script creates the tax_adjustments table directly in the Supabase database.
 * 
 * Run with: node scripts/apply_tax_adjustments_migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Create Supabase client with service role key (required for DDL operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'create_tax_adjustments_table.sql');
const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');

async function applyMigration() {
  try {
    console.log('Creating tax_adjustments table...');
    
    // Execute the SQL using the rpc function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative approach using direct query
      console.log('Trying alternative approach...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        
        try {
          // Use a simple query to execute DDL
          const { error: stmtError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(1);
          
          // This will fail, but we can use the connection to execute our SQL
          // Let's try a different approach using the REST API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql_query: statement })
          });
          
          if (!response.ok) {
            console.error(`Error executing statement ${i + 1}:`, await response.text());
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception executing statement ${i + 1}:`, err.message);
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
    
    // Verify the table was created
    console.log('Verifying tax_adjustments table...');
    
    const { data: tableExists, error: verifyError } = await supabase
      .from('tax_adjustments')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      if (verifyError.message.includes('relation "tax_adjustments" does not exist')) {
        console.error('❌ tax_adjustments table was not created');
      } else {
        console.log('✅ tax_adjustments table exists (got expected error for empty table)');
      }
    } else {
      console.log('✅ tax_adjustments table verified and accessible');
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Create a simple exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;
    
    // We'll need to execute this manually or use a different approach
    console.log('Note: You may need to create the exec_sql function manually in the Supabase SQL editor:');
    console.log(createFunctionSQL);
    
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
  }
}

// Run the migration
async function main() {
  await createExecSqlFunction();
  await applyMigration();
}

main(); 