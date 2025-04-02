import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a client for the browser with cookie-based session handling
export const supabase = createClientComponentClient() 