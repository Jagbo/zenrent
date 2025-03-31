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
    // Create Supabase client with service role in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[PROPERTIES API] Development mode: Using service role client');
      const testUserId = '00000000-0000-0000-0000-000000000001';
      
      // Create admin client with service role
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      
      console.log(`[PROPERTIES API] Fetching properties for test user: ${testUserId}`);
      
      // Query properties without relying on RLS
      const { data: properties, error: propertiesError } = await supabaseAdmin
        .from('properties')
        .select('id, property_code, address, property_type, bedrooms')
        .eq('user_id', testUserId);

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
        console.warn('[PROPERTIES API] No properties found for test user!');
        return NextResponse.json([], { status: 200 });
      }

      console.log('[PROPERTIES API] Raw properties data:', properties);

      // Transform data format to match frontend expectations
      const transformedProperties = properties.map((property) => ({
        id: property.id,
        property_code: property.property_code,
        address: property.address,
        type: property.property_type,
        total_units: property.bedrooms
      }));

      console.log(`[PROPERTIES API] Found ${transformedProperties.length} properties`);
      return NextResponse.json(transformedProperties, { status: 200 });
    } else {
      // Production mode - use route handler with cookies for auth
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
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
        .select('id, property_code, address, property_type, bedrooms')
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
        console.warn('[PROPERTIES API] No properties found for authenticated user');
        return NextResponse.json([], { status: 200 });
      }
      
      // Transform data format to match frontend expectations
      const transformedProperties = properties.map((property) => ({
        id: property.id,
        property_code: property.property_code,
        address: property.address,
        type: property.property_type,
        total_units: property.bedrooms
      }));
      
      console.log(`[PROPERTIES API] Found ${transformedProperties.length} properties`);
      return NextResponse.json(transformedProperties, { status: 200 });
    }
  } catch (error) {
    console.error('[PROPERTIES API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 