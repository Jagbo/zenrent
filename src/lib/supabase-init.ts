import { supabase } from './supabase';

/**
 * Initializes the Supabase environment.
 * Must be called on application startup in server components or layout.
 * This ensures RLS policies work correctly in development mode.
 */
export async function initSupabaseEnvironment() {
  // Set app.environment to 'development' in development mode
  // This enables special RLS policies for the test user
  if (process.env.NODE_ENV === 'development') {
    try {
      await supabase.rpc('set_app_environment', { env: 'development' });
      console.log('Supabase environment set to development');
    } catch (error) {
      console.error('Failed to set Supabase environment:', error);
    }
  }
} 