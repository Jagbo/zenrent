import { supabase } from "./supabase";

/**
 * Initializes the Supabase environment.
 * Must be called on application startup in server components or layout.
 */
export async function initSupabaseEnvironment() {
  // No longer setting development mode to ensure normal authentication flow
  console.log("Initializing Supabase environment");
}
