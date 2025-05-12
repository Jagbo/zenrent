/**
 * Authentication Callback Route
 * 
 * This route handles authentication callbacks and triggers the property enrichment process.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { queueUserForEnrichment } from '@/services/backgroundEnrichmentService';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // Queue the user for property enrichment in the background
      queueUserForEnrichment(data.user.id).catch(err => {
        console.error('Failed to queue user for enrichment:', err);
      });
    }
  }
  
  // Redirect to the dashboard or home page
  return NextResponse.redirect(requestUrl.origin);
}
