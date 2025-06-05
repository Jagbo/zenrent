import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { enabled } = body;

    // Validate the enabled parameter
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      );
    }

    console.log(`[WhatsApp Opt-In] User ${user.id} toggling WhatsApp to: ${enabled}`);

    // Update the user's WhatsApp opt-in status
    const updateData: any = {
      whatsapp_enabled: enabled,
      whatsapp_notifications_enabled: enabled, // Default to same as enabled
    };

    // If enabling for the first time, set the opted_in_at timestamp
    if (enabled) {
      updateData.whatsapp_opted_in_at = new Date().toISOString();
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select('whatsapp_enabled, whatsapp_opted_in_at, whatsapp_notifications_enabled, first_name, last_name')
      .single();

    if (updateError) {
      console.error('Error updating WhatsApp opt-in status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update WhatsApp settings' },
        { status: 500 }
      );
    }

    // If enabling WhatsApp, check if user has tenants to message
    let tenantCount = 0;
    if (enabled) {
      try {
        // Use the database function we created in the migration
        const { data: tenants, error: tenantsError } = await supabase
          .rpc('get_landlord_tenants_for_whatsapp', { p_landlord_id: user.id });

        if (!tenantsError && tenants) {
          tenantCount = tenants.length;
        }
      } catch (error) {
        console.error('Error fetching tenant count:', error);
        // Don't fail the request if tenant count fails - it's just informational
      }
    }

    // Create full name from first and last name
    const landlordName = updatedProfile.first_name && updatedProfile.last_name 
      ? `${updatedProfile.first_name} ${updatedProfile.last_name}`
      : updatedProfile.first_name || updatedProfile.last_name || 'Landlord';

    console.log(`[WhatsApp Opt-In] Successfully updated for user ${user.id}. Enabled: ${enabled}, Tenant count: ${tenantCount}`);

    // Return success response with updated status
    return NextResponse.json({
      success: true,
      whatsapp_enabled: updatedProfile.whatsapp_enabled,
      whatsapp_opted_in_at: updatedProfile.whatsapp_opted_in_at,
      whatsapp_notifications_enabled: updatedProfile.whatsapp_notifications_enabled,
      landlord_name: landlordName,
      tenant_count: tenantCount,
      message: enabled 
        ? `WhatsApp messaging enabled! ${tenantCount > 0 ? `You can now receive messages from ${tenantCount} tenant(s).` : 'Add tenants to start receiving messages.'}` 
        : 'WhatsApp messaging disabled.'
    });

  } catch (error) {
    console.error('Unexpected error in WhatsApp opt-in toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to toggle opt-in status.' },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to toggle opt-in status.' },
    { status: 405 }
  );
} 