import { supabase } from "./supabase";

/**
 * Initializes the Supabase environment.
 * Must be called on application startup in server components or layout.
 * Optimized for performance - minimal logging and operations.
 */
export async function initSupabaseEnvironment() {
  // Removed excessive logging for performance
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("Initializing Supabase environment");
  }
  
  // Perform any necessary initialization here
  // Currently no operations needed - client is lazy-loaded
}
