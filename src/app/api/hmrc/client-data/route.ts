import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ClientData } from '@/lib/services/hmrc/fraudPrevention/types';

/**
 * API route to store client data for HMRC fraud prevention headers
 * 
 * This endpoint receives client data collected on the frontend and stores it
 * in the user's session for use in generating fraud prevention headers.
 */

/**
 * Create Supabase client for server-side operations
 */
function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    // Get the client data from the request body
    const clientData: ClientData = await request.json();
    
    // Validate the client data
    if (!clientData || !clientData.device || !clientData.browser) {
      return NextResponse.json(
        { error: 'Invalid client data' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session
    const supabase = createServerSupabaseClient();
    const cookieStore = request.cookies;
    const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseAuthToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseAuthToken);
    
    if (authError || !user) {
      console.error('Error getting user from session:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Store the client data in the database
    const { error: storageError } = await supabase
      .from('hmrc_client_data')
      .upsert({
        user_id: user.id,
        client_data: clientData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (storageError) {
      console.error('Error storing client data:', storageError);
      return NextResponse.json(
        { error: 'Failed to store client data' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Client data stored successfully'
    });
  } catch (error) {
    console.error('Error in client data API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
