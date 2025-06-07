import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Configure cookie options to work across development domains
const cookieOptions = {
  domain: process.env.NODE_ENV === 'development' ? '' : undefined,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV !== 'development'
};

// Performance optimized Supabase client configuration
const supabaseConfig = {
  cookieOptions,
  // Performance optimizations
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  // Reduce realtime overhead if not needed
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events for performance
    },
  },
  // Connection pooling for better performance
  db: {
    schema: 'public',
  },
};

// Create a client for the browser with cookie-based session handling
// Using consistent cookie options to prevent rate limit issues across different domains
export const supabase = createClientComponentClient(supabaseConfig);
