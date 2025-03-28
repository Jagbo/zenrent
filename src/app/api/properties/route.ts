import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error: ' + sessionError.message },
        { status: 401 }
      );
    }

    // In development, if no session exists, use the test user
    if (!session && process.env.NODE_ENV === 'development') {
      console.log('Using test user session in development');
      const testUserId = '00000000-0000-0000-0000-000000000001';
      
      // Get all properties for the test user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          property_code,
          address,
          property_type,
          bedrooms
        `)
        .eq('user_id', testUserId);

      if (propertiesError) {
        console.error('Properties fetch error:', propertiesError);
        return NextResponse.json(
          { error: 'Failed to fetch properties: ' + propertiesError.message },
          { status: 500 }
        );
      }

      if (!properties || properties.length === 0) {
        console.log('No properties found for test user:', testUserId);
        return NextResponse.json(
          { error: 'No properties found for this user' },
          { status: 404 }
        );
      }

      // Transform the data to match the expected format
      const transformedProperties = properties.map(property => ({
        id: property.id,
        property_code: property.property_code,
        address: property.address,
        type: property.property_type,
        total_units: property.bedrooms
      }));

      console.log('Found properties for test user:', transformedProperties);
      return NextResponse.json(transformedProperties);
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session found. Please log in.' },
        { status: 401 }
      );
    }

    console.log('User ID:', session.user.id);

    // Get all properties for the current user
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        property_code,
        address,
        property_type,
        bedrooms
      `)
      .eq('user_id', session.user.id);

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties: ' + propertiesError.message },
        { status: 500 }
      );
    }

    if (!properties || properties.length === 0) {
      console.log('No properties found for user:', session.user.id);
      return NextResponse.json(
        { error: 'No properties found for this user' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const transformedProperties = properties.map(property => ({
      id: property.id,
      property_code: property.property_code,
      address: property.address,
      type: property.property_type,
      total_units: property.bedrooms
    }));

    console.log('Found properties:', transformedProperties);
    return NextResponse.json(transformedProperties);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 