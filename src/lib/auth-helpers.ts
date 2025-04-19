import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

/**
 * Get the currently authenticated user
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching auth user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Unexpected error in getAuthUser:', error);
    return null;
  }
}

/**
 * Get the ID of the currently authenticated user
 * @returns The authenticated user ID or null if not authenticated
 */
export async function getAuthUserId(): Promise<string | null> {
  const user = await getAuthUser();
  return user?.id || null;
} 