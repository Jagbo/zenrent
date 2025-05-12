/**
 * Trigger Property Enrichment Script
 * 
 * This script manually triggers the property enrichment process for a specific user.
 * It's useful for testing the enrichment service without having to go through the login flow.
 * 
 * Usage: npx tsx src/scripts/triggerPropertyEnrichment.ts <userId>
 */

import dotenv from 'dotenv';
import { enrichUserProperties } from '../services/propertyEnrichmentService';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  // Get the user ID from command line arguments
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Please provide a user ID as a command line argument.');
    console.error('Usage: npx tsx src/scripts/triggerPropertyEnrichment.ts <userId>');
    process.exit(1);
  }
  
  console.log(`Triggering property enrichment for user: ${userId}`);
  
  try {
    // Run the enrichment process
    const success = await enrichUserProperties(userId);
    
    if (success) {
      console.log('Property enrichment completed successfully!');
    } else {
      console.error('Property enrichment failed.');
    }
  } catch (error) {
    console.error('Error during property enrichment:', error);
  }
}

// Run the script
main().catch(console.error);
