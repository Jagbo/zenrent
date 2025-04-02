import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Define a basic Property type based on selection
interface Property {
  id: string;
  property_code: string | null;
  address: string | null;
  property_type: string | null;
  bedrooms: number | null;
}

export async function GET(request: Request) {
  try {
    // Use createRouteHandlerClient for both development and production to respect RLS
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[PROPERTIES API] Error getting session:', sessionError);
      return NextResponse.json({ error: 'Failed to get user session' }, { status: 500 });
    }
    
    if (!session) {
      console.warn('[PROPERTIES API] No user session found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    console.log(`[PROPERTIES API] Fetching properties for authenticated user: ${userId}`);
    
    // Query properties for the authenticated user
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, property_code, address, property_type, bedrooms') // Select necessary fields
      .eq('user_id', userId);
    
    // Handle errors
    if (propertiesError) {
      console.error('[PROPERTIES API] Database error:', propertiesError);
      return NextResponse.json(
        { error: 'Database error: ' + propertiesError.message },
        { status: 500 }
      );
    }
    
    // If no properties found
    if (!properties || properties.length === 0) {
      console.warn(`[PROPERTIES API] No properties found for user ${userId}`);
      return NextResponse.json([], { status: 200 }); // Return empty array if no properties
    }
    
    console.log('[PROPERTIES API] Raw properties data from DB:', properties);

    // Transform data format to match frontend expectations
    const transformedProperties = properties.map((property) => ({
      id: property.id,
      property_code: property.property_code,
      address: property.address,
      // Ensure 'type' and 'total_units' match the expected frontend structure
      type: property.property_type, // Assuming property_type maps to type
      total_units: property.bedrooms // Assuming bedrooms maps to total_units
    }));
    
    console.log(`[PROPERTIES API] Found and transformed ${transformedProperties.length} properties`);
    return NextResponse.json(transformedProperties, { status: 200 });

  } catch (error) {
    console.error('[PROPERTIES API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 