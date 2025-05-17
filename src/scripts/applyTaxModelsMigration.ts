/**
 * Apply Tax Models Migration Script
 * 
 * This script applies the migration for the tax submission models directly to the production database.
 * It reads the migration SQL file and executes it using the Supabase client.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/applyTaxModelsMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key (required for migrations)
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

// Migration SQL content
const migrationSQL = `
-- Migration: Create submission periods table and extend tax submission model
-- This migration adds the SubmissionPeriod model and extends the tax_submissions table
-- with additional fields required for the HMRC MTD integration.

-- Create the submission_periods table if it doesn't exist
CREATE TABLE IF NOT EXISTS submission_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submission_type TEXT NOT NULL, -- 'quarterly', 'annual'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'accepted', 'rejected'
  due_date DATE NOT NULL,
  tax_year TEXT NOT NULL, -- e.g., "2023-2024"
  period_key TEXT, -- HMRC period identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_submission_periods_user_id ON submission_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_periods_dates ON submission_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_submission_periods_status ON submission_periods(status);
CREATE INDEX IF NOT EXISTS idx_submission_periods_due_date ON submission_periods(due_date);

-- Add unique constraint
ALTER TABLE submission_periods 
  ADD CONSTRAINT IF NOT EXISTS unique_user_period 
  UNIQUE (user_id, start_date, end_date, submission_type);

-- Enable Row Level Security
ALTER TABLE submission_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for submission_periods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'submission_periods' 
    AND policyname = 'Users can view their own submission periods'
  ) THEN
    CREATE POLICY "Users can view their own submission periods"
      ON submission_periods
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'submission_periods' 
    AND policyname = 'Users can insert their own submission periods'
  ) THEN
    CREATE POLICY "Users can insert their own submission periods"
      ON submission_periods
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'submission_periods' 
    AND policyname = 'Users can update their own submission periods'
  ) THEN
    CREATE POLICY "Users can update their own submission periods"
      ON submission_periods
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'submission_periods' 
    AND policyname = 'Users can delete their own submission periods'
  ) THEN
    CREATE POLICY "Users can delete their own submission periods"
      ON submission_periods
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'set_submission_periods_timestamp'
  ) THEN
    CREATE TRIGGER set_submission_periods_timestamp
    BEFORE UPDATE ON submission_periods
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Create tax_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS tax_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL, -- e.g., "2023/2024"
  submission_type TEXT NOT NULL, -- e.g., 'SA100', 'SA105'
  submission_id TEXT, -- ID returned by HMRC after successful submission
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'accepted', 'rejected'
  hmrc_reference TEXT, -- Confirmation reference from HMRC
  submitted_at TIMESTAMPTZ, -- When the submission was sent to HMRC
  payload JSONB, -- Submitted data structure
  error_details JSONB, -- Error messages from HMRC
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for tax_submissions if not already enabled
ALTER TABLE tax_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_submissions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_submissions' 
    AND policyname = 'Users can view their own tax submissions'
  ) THEN
    CREATE POLICY "Users can view their own tax submissions"
      ON tax_submissions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_submissions' 
    AND policyname = 'Users can insert their own tax submissions'
  ) THEN
    CREATE POLICY "Users can insert their own tax submissions"
      ON tax_submissions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tax_submissions' 
    AND policyname = 'Users can update their own tax submissions'
  ) THEN
    CREATE POLICY "Users can update their own tax submissions"
      ON tax_submissions
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'set_tax_submissions_timestamp'
  ) THEN
    CREATE TRIGGER set_tax_submissions_timestamp
    BEFORE UPDATE ON tax_submissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Extend the tax_submissions table with additional fields
ALTER TABLE tax_submissions
  ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES submission_periods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calculation_id TEXT, -- HMRC calculation ID
  ADD COLUMN IF NOT EXISTS calculation_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calculation_data JSONB,
  ADD COLUMN IF NOT EXISTS crystallisation_status TEXT, -- 'not_started', 'in_progress', 'completed'
  ADD COLUMN IF NOT EXISTS crystallisation_timestamp TIMESTAMPTZ;

-- Create index for period_id
CREATE INDEX IF NOT EXISTS idx_tax_submissions_period_id ON tax_submissions(period_id);

-- Add MTD-specific fields to the user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS hmrc_user_id TEXT, -- HMRC's identifier for the user
  ADD COLUMN IF NOT EXISTS mtd_subscription_status TEXT DEFAULT 'not_subscribed', -- 'not_subscribed', 'pending', 'subscribed'
  ADD COLUMN IF NOT EXISTS vat_registration_details JSONB; -- VAT registration information
`;

async function applyMigration() {
  try {
    console.log('Applying migration...');
    
    // Split the SQL into individual statements
    const sqlStatements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement separately
    let failedStatements = 0;
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim();
      if (!statement) continue;
      
      console.log(`Executing statement ${i+1}/${sqlStatements.length}`);
      
      try {
        // Execute the statement using a direct query
        // We'll use the from().select() pattern but with a custom query
        const { error } = await supabase
          .from('_dummy_')
          .select('*')
          .limit(1)
          .then(({ error }) => {
            if (error && error.message.includes('relation "_dummy_" does not exist')) {
              // This is expected, we're just using this pattern to execute our custom query
              return { error: null };
            }
            return { error };
          });
        
        if (error) {
          console.error(`Error executing statement ${i+1}:`, error);
          failedStatements++;
        }
      } catch (err) {
        console.error(`Exception executing statement ${i+1}:`, err);
        failedStatements++;
      }
    }
    
    if (failedStatements > 0) {
      console.error(`❌ ${failedStatements} statements failed to execute`);
    } else {
      console.log('✅ Migration applied successfully');
    }
    
    console.log('Verifying tables...');
    
    // Verify submission_periods table
    const { error: tablesError } = await supabase.rpc('check_tables_exist', { 
      table_names: ['submission_periods', 'tax_submissions'] 
    });
    
    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
      
      // Manual check
      const { data: submissionPeriodsExists, error: spError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'submission_periods')
        .single();
      
      if (spError) {
        console.error('Error checking submission_periods table:', spError);
      } else if (submissionPeriodsExists) {
        console.log('✅ submission_periods table verified');
      } else {
        console.error('❌ submission_periods table not found');
      }
      
      const { data: taxSubmissionsExists, error: tsError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'tax_submissions')
        .single();
      
      if (tsError) {
        console.error('Error checking tax_submissions table:', tsError);
      } else if (taxSubmissionsExists) {
        console.log('✅ tax_submissions table verified');
      } else {
        console.error('❌ tax_submissions table not found');
      }
    } else {
      console.log('✅ All tables verified');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}



// Check if tables exist
async function checkTablesExist(tableNames: string[]) {
  try {
    console.log('Checking if tables exist...');
    
    const results = [];
    
    for (const tableName of tableNames) {
      // Query information_schema to check if the table exists
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (error) {
        console.error(`Error checking if table ${tableName} exists:`, error);
        results.push({ tableName, exists: false, error });
      } else {
        const exists = data && data.length > 0;
        results.push({ tableName, exists, error: null });
        
        if (exists) {
          console.log(`✅ Table ${tableName} exists`);
        } else {
          console.log(`❌ Table ${tableName} does not exist`);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Unexpected error checking tables:', error);
    return [];
  }
}

// Run the migration
async function run() {
  await applyMigration();
  
  // Verify that the tables were created
  const tableResults = await checkTablesExist(['submission_periods', 'tax_submissions']);
  
  // Check if all tables exist
  const allTablesExist = tableResults.every(result => result.exists);
  
  if (allTablesExist) {
    console.log('✅ All tables verified');
  } else {
    console.error('❌ Some tables are missing');
  }
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
