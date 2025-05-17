import { applySecurityMigrations } from '@/lib/services/security/migrations/applyMigrations';

/**
 * Script to apply security migrations to the database
 */
async function main() {
  console.log('Starting security migrations...');
  
  try {
    await applySecurityMigrations();
    console.log('Security migrations completed successfully');
  } catch (error) {
    console.error('Error applying security migrations:', error);
    process.exit(1);
  }
}

// Run the script
main();
