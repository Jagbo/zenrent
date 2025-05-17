import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Get the currently authenticated user in server components or API routes
 * @returns The authenticated user or null if not authenticated
 */
export async function getServerAuthUser(): Promise<User | null> {
  try {
    // Get cookie store and create Supabase client
    // Using the updated pattern with await for cookies()
    const cookieStore = await cookies();
    
    // Create Supabase client with async cookies function
    const supabase = createRouteHandlerClient({
      cookies: async () => cookieStore
    });
    
    // Get the session and check for errors
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching server auth session:', error);
      return null;
    }
    
    return data.session?.user || null;
  } catch (error) {
    console.error('Unexpected error in getServerAuthUser:', error);
    return null;
  }
}

/**
 * Get the ID of the currently authenticated user in server components or API routes
 * @returns The authenticated user ID or null if not authenticated
 */
export async function getServerAuthUserId(): Promise<string | null> {
  const user = await getServerAuthUser();
  return user?.id || null;
}
