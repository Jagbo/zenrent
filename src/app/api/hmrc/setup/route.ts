import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations to create tables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: Request) {
  try {
    // Only allow this in development for safety
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 });
    }
    
    // Execute SQL to create the necessary tables and functions
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Table to store HMRC OAuth 2.0 tokens for users
        CREATE TABLE IF NOT EXISTS hmrc_authorizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          access_token TEXT, 
          refresh_token TEXT,
          expires_at TIMESTAMPTZ,
          scope TEXT, -- Store granted scopes
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (user_id) -- Assuming one HMRC connection per user
        );

        -- Enable Row Level Security (RLS)
        ALTER TABLE hmrc_authorizations ENABLE ROW LEVEL SECURITY;

        -- Policy: Allow authenticated users to select their own authorization
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated select own authorization' 
            AND tablename = 'hmrc_authorizations'
          ) THEN
            CREATE POLICY "Allow authenticated select own authorization" 
            ON hmrc_authorizations 
            FOR SELECT 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;

        -- Policy: Allow authenticated users to insert their own authorization
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated insert own authorization' 
            AND tablename = 'hmrc_authorizations'
          ) THEN
            CREATE POLICY "Allow authenticated insert own authorization" 
            ON hmrc_authorizations 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          END IF;
        END
        $$;

        -- Policy: Allow authenticated users to update their own authorization
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated update own authorization' 
            AND tablename = 'hmrc_authorizations'
          ) THEN
            CREATE POLICY "Allow authenticated update own authorization" 
            ON hmrc_authorizations 
            FOR UPDATE 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;

        -- Policy: Allow authenticated users to delete their own authorization
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated delete own authorization' 
            AND tablename = 'hmrc_authorizations'
          ) THEN
            CREATE POLICY "Allow authenticated delete own authorization" 
            ON hmrc_authorizations 
            FOR DELETE 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;

        -- Create function to store HMRC tokens that bypasses RLS
        CREATE OR REPLACE FUNCTION store_hmrc_tokens(
          p_user_id UUID,
          p_access_token TEXT,
          p_refresh_token TEXT,
          p_expires_at TIMESTAMPTZ,
          p_scope TEXT DEFAULT 'read:self-assessment write:self-assessment'
        ) RETURNS BOOLEAN
        SECURITY DEFINER
        SET search_path = public, pg_temp
        LANGUAGE plpgsql
        AS $$
        BEGIN
          -- First try to delete any existing record
          DELETE FROM hmrc_authorizations WHERE user_id = p_user_id;
          
          -- Insert new record
          INSERT INTO hmrc_authorizations (
            user_id,
            access_token,
            refresh_token,
            expires_at,
            scope,
            created_at,
            updated_at
          ) VALUES (
            p_user_id,
            p_access_token,
            p_refresh_token,
            p_expires_at,
            p_scope,
            NOW(),
            NOW()
          );
          
          RETURN TRUE;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to store HMRC tokens: %', SQLERRM;
            RETURN FALSE;
        END;
        $$;

        -- === Add tax_forms table creation ===
        CREATE TABLE IF NOT EXISTS tax_forms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          tax_year TEXT NOT NULL, -- e.g., "2023/2024"
          sa100_url TEXT,
          sa105_url TEXT,
          combined_url TEXT,
          status TEXT DEFAULT 'pending', -- e.g., pending, generated, submitted, failed
          generated_at TIMESTAMPTZ, -- Timestamp when forms were generated
          submitted_at TIMESTAMPTZ, -- Timestamp when submitted to HMRC
          submission_ref TEXT, -- HMRC submission reference
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (user_id, tax_year) -- Ensure only one set of forms per user per tax year
        );

        -- Enable Row Level Security (RLS) for tax_forms
        ALTER TABLE tax_forms ENABLE ROW LEVEL SECURITY;

        -- Policies for tax_forms:
        -- Allow users to manage their own tax forms
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated select own tax_forms' 
            AND tablename = 'tax_forms'
          ) THEN
            CREATE POLICY "Allow authenticated select own tax_forms" 
            ON tax_forms 
            FOR SELECT 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated insert own tax_forms' 
            AND tablename = 'tax_forms'
          ) THEN
            CREATE POLICY "Allow authenticated insert own tax_forms" 
            ON tax_forms 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
          END IF;
        END
        $$;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated update own tax_forms' 
            AND tablename = 'tax_forms'
          ) THEN
            CREATE POLICY "Allow authenticated update own tax_forms" 
            ON tax_forms 
            FOR UPDATE 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;
        
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_policies 
            WHERE policyname = 'Allow authenticated delete own tax_forms' 
            AND tablename = 'tax_forms'
          ) THEN
            CREATE POLICY "Allow authenticated delete own tax_forms" 
            ON tax_forms 
            FOR DELETE 
            USING (auth.uid() = user_id);
          END IF;
        END
        $$;
        -- === End tax_forms table creation ===
      `
    });

    if (error) {
      console.error('Error setting up HMRC tables:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'HMRC tables and functions created successfully' });
  } catch (error) {
    console.error('Error in HMRC setup:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 