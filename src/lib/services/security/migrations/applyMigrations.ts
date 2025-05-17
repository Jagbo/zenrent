import { createServerSupabaseClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

/**
 * Apply security migrations to the database
 */
export async function applySecurityMigrations(): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get all migration files
  const migrationsDir = path.join(__dirname);
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations are applied in order
  
  console.log(`Found ${migrationFiles.length} migration files to apply`);
  
  // Apply each migration
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Applying migration: ${file}`);
    
    try {
      // Execute the SQL migration
      const { error } = await supabase.rpc('run_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        throw error;
      }
      
      console.log(`Successfully applied migration: ${file}`);
    } catch (error) {
      console.error(`Failed to apply migration ${file}:`, error);
      throw error;
    }
  }
  
  console.log('All security migrations applied successfully');
}
