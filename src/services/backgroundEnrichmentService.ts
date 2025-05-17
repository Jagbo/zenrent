/**
 * Background Enrichment Service
 * 
 * This service runs in the background to enrich property data when users log in.
 * It uses a queue system to prevent overloading the API and database.
 */

import { enrichUserProperties } from './propertyEnrichmentService';

// Simple in-memory queue to prevent duplicate enrichment jobs
const processingQueue = new Set<string>();

/**
 * Queue a user for property enrichment
 * @param userId - The ID of the user to enrich properties for
 * @returns Promise that resolves when the enrichment is complete
 */
export async function queueUserForEnrichment(userId: string): Promise<void> {
  // If this user is already being processed, don't queue again
  if (processingQueue.has(userId)) {
    console.log(`User ${userId} is already in the enrichment queue.`);
    return;
  }
  
  // Add user to processing queue
  processingQueue.add(userId);
  
  try {
    // Process the enrichment in the background
    // We don't await this to allow the login process to continue
    processUserEnrichment(userId).catch(error => {
      console.error(`Error in background enrichment for user ${userId}:`, error);
    });
    
    console.log(`User ${userId} queued for property enrichment.`);
  } catch (error) {
    console.error(`Error queueing user ${userId} for enrichment:`, error);
    processingQueue.delete(userId);
  }
}

/**
 * Process property enrichment for a user
 * @param userId - The ID of the user to process
 */
async function processUserEnrichment(userId: string): Promise<void> {
  try {
    console.log(`Starting background enrichment for user ${userId}`);
    
    // Perform the actual enrichment
    await enrichUserProperties(userId);
    
    console.log(`Completed background enrichment for user ${userId}`);
  } catch (error) {
    console.error(`Error in processUserEnrichment for ${userId}:`, error);
  } finally {
    // Always remove the user from the queue when done
    processingQueue.delete(userId);
  }
}

/**
 * Check if a user is currently being processed
 * @param userId - The ID of the user to check
 * @returns Boolean indicating if the user is in the processing queue
 */
export function isUserBeingProcessed(userId: string): boolean {
  return processingQueue.has(userId);
}
