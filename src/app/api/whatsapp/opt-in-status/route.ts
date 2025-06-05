import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[WhatsApp Status] Fetching opt-in status for user ${user.id}`);

    // Get user's WhatsApp settings from their profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        whatsapp_enabled,
        whatsapp_opted_in_at,
        whatsapp_notifications_enabled,
        first_name,
        last_name,
        user_id
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch WhatsApp settings' },
        { status: 500 }
      );
    }

    // Create full name from first and last name
    const landlordName = userProfile.first_name && userProfile.last_name 
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : userProfile.first_name || userProfile.last_name || 'Landlord';

    // If WhatsApp is enabled, get tenant information for context
    let tenants: any[] = [];
    let tenantCount = 0;
    
    if (userProfile.whatsapp_enabled) {
      try {
        // Use the database function we created in the migration
        const { data: tenantData, error: tenantsError } = await supabase
          .rpc('get_landlord_tenants_for_whatsapp', { p_landlord_id: user.id });

        if (!tenantsError && tenantData) {
          tenants = tenantData;
          tenantCount = tenantData.length;
        }
      } catch (error) {
        console.error('Error fetching tenants for WhatsApp:', error);
        // Don't fail the request if tenant fetch fails
      }
    }

    // Check if ZenRent's central WhatsApp is configured (for admin visibility)
    const isWhatsAppConfigured = !!(
      process.env.WHATSAPP_WABA_ID && 
      process.env.WHATSAPP_SYSTEM_USER_TOKEN
    );

    console.log(`[WhatsApp Status] User ${user.id} - Enabled: ${userProfile.whatsapp_enabled}, Tenants: ${tenantCount}`);

    // Return comprehensive status information
    return NextResponse.json({
      // Basic opt-in status
      whatsapp_enabled: userProfile.whatsapp_enabled || false,
      whatsapp_opted_in_at: userProfile.whatsapp_opted_in_at,
      whatsapp_notifications_enabled: userProfile.whatsapp_notifications_enabled || false,
      
      // User context
      landlord_id: userProfile.user_id,
      landlord_name: landlordName,
      
      // Tenant context
      tenant_count: tenantCount,
      tenants: tenants.map(tenant => ({
        id: tenant.tenant_id,
        name: tenant.tenant_name,
        phone: tenant.tenant_phone,
        email: tenant.tenant_email,
        property_address: tenant.property_address,
        lease_status: tenant.lease_status
      })),
      
      // System status (for debugging/admin)
      system_configured: isWhatsAppConfigured,
      
      // Helper message for UI
      status_message: userProfile.whatsapp_enabled 
        ? (tenantCount > 0 
            ? `WhatsApp messaging is active for ${tenantCount} tenant(s)`
            : 'WhatsApp messaging is enabled but no tenants found'
          )
        : 'WhatsApp messaging is disabled',
      
      // Action recommendations for UI
      can_receive_messages: userProfile.whatsapp_enabled && tenantCount > 0,
      needs_tenants: userProfile.whatsapp_enabled && tenantCount === 0,
      can_enable: !userProfile.whatsapp_enabled && isWhatsAppConfigured
    });

  } catch (error) {
    console.error('Unexpected error fetching WhatsApp opt-in status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to check opt-in status.' },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to check opt-in status.' },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to check opt-in status.' },
    { status: 405 }
  );
} 