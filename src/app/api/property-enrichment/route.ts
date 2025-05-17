import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { enrichUserProperties } from '@/lib/propertyEnrichmentService';

// This API route triggers property data enrichment for the current user
export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Trigger the enrichment process in the background
    // We don't await this to avoid blocking the response
    enrichUserProperties(user.id)
      .then(() => {
        console.log(`Property enrichment completed for user ${user.id}`);
      })
      .catch((error) => {
        console.error(`Property enrichment failed for user ${user.id}:`, error);
      });
    
    // Return success immediately, enrichment continues in background
    return NextResponse.json({ 
      message: 'Property enrichment process started',
      userId: user.id
    });
  } catch (error) {
    console.error('Error in property enrichment API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
