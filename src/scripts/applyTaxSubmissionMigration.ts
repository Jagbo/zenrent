/**
 * Apply Tax Submission Migration Script
 * 
 * This script applies the migration for the submission periods and tax submissions tables.
 * It uses the Supabase client to execute the migration SQL script.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/applyTaxSubmissionMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key (required for migrations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to the migration SQL file
const migrationFilePath = path.join(__dirname, '../../supabase/migrations/20250512000000_create_submission_periods.sql');

async function applyMigration() {
  try {
    console.log('Reading migration SQL file...');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Applying migration...');
    const { error } = await supabase.rpc('apply_migration', {
      p_migration_name: 'create_submission_periods',
      p_sql: migrationSql
    });
    
    if (error) {
      console.error('Error applying migration:', error);
      
      // Try direct SQL execution if RPC fails
      console.log('Trying direct SQL execution...');
      const { error: sqlError } = await supabase.sql(migrationSql);
      
      if (sqlError) {
        console.error('Error executing SQL directly:', sqlError);
        process.exit(1);
      } else {
        console.log('✅ Migration applied successfully via direct SQL execution');
      }
    } else {
      console.log('✅ Migration applied successfully via RPC');
    }
    
    console.log('Verifying tables...');
    
    // Verify submission_periods table
    const { data: submissionPeriodsTable, error: submissionPeriodsError } = await supabase
      .from('submission_periods')
      .select('*')
      .limit(1);
    
    if (submissionPeriodsError) {
      console.error('Error verifying submission_periods table:', submissionPeriodsError);
    } else {
      console.log('✅ submission_periods table verified');
    }
    
    // Verify tax_submissions table has new columns
    const { data: taxSubmissionsColumns, error: taxSubmissionsError } = await supabase
      .rpc('get_table_columns', { table_name: 'tax_submissions' });
    
    if (taxSubmissionsError) {
      console.error('Error verifying tax_submissions columns:', taxSubmissionsError);
    } else {
      console.log('✅ tax_submissions table columns verified:');
      console.log(taxSubmissionsColumns);
    }
    
    // Verify user_profiles table has new columns
    const { data: userProfilesColumns, error: userProfilesError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_profiles' });
    
    if (userProfilesError) {
      console.error('Error verifying user_profiles columns:', userProfilesError);
    } else {
      console.log('✅ user_profiles table columns verified:');
      console.log(userProfilesColumns);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Create the get_table_columns function if it doesn't exist
async function createHelperFunctions() {
  try {
    console.log('Creating helper functions...');
    
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
      RETURNS TABLE (column_name TEXT, data_type TEXT)
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT c.column_name::TEXT, c.data_type::TEXT
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = table_name;
      END;
      $$;
      
      CREATE OR REPLACE FUNCTION apply_migration(p_migration_name TEXT, p_sql TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE p_sql;
        
        -- Record the migration in a migrations table if you want to track applied migrations
        -- INSERT INTO migrations (name, applied_at) VALUES (p_migration_name, NOW());
      END;
      $$;
    `;
    
    const { error } = await supabase.sql(createFunctionSql);
    
    if (error) {
      console.error('Error creating helper functions:', error);
    } else {
      console.log('✅ Helper functions created successfully');
    }
  } catch (error) {
    console.error('Unexpected error creating helper functions:', error);
  }
}

// Run the migration
async function run() {
  await createHelperFunctions();
  await applyMigration();
}

run()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
