import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[USER-PROFILE API] Error getting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to get user session" },
        { status: 500 },
      );
    }

    if (!session) {
      console.warn("[USER-PROFILE API] No user session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    console.log(`[USER-PROFILE API] Fetching profile for user: ${userId}`);

    // Query user profile - first try with user_id, then with id
    let { data: profile, error: profileError } = await supabase
      .from("user_profiles")
               .select(`
           id,
           user_id,
           first_name,
           last_name,
           phone,
           notification_preferences,
           plan_id,
           billing_interval,
           subscription_status,
           stripe_customer_id,
           next_billing_date,
           created_at,
           updated_at
         `)
      .eq("user_id", userId)
      .single();

    // If not found with user_id, try with id (for backward compatibility)
    if (profileError && profileError.code === 'PGRST116') {
      const result = await supabase
        .from("user_profiles")
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          notification_preferences,
          plan_id,
          billing_interval,
          subscription_status,
          stripe_customer_id,
          next_billing_date,
          created_at,
          updated_at
        `)
        .eq("id", userId)
        .single();
      
      profile = result.data;
      profileError = result.error;
    }

    if (profileError) {
      console.error("[USER-PROFILE API] Database error:", profileError);
      return NextResponse.json(
        { error: "Database error: " + profileError.message },
        { status: 500 },
      );
    }

    if (!profile) {
      console.warn(`[USER-PROFILE API] No profile found for user ${userId}`);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    console.log(`[USER-PROFILE API] Profile found for user ${userId}`);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("[USER-PROFILE API] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[USER-PROFILE API] Error getting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to get user session" },
        { status: 500 },
      );
    }

    if (!session) {
      console.warn("[USER-PROFILE API] No user session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    console.log(`[USER-PROFILE API] Updating profile for user: ${userId}`);
    console.log("[USER-PROFILE API] Update data:", body);

    // Validate and sanitize the update data
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'notification_preferences',
      'plan_id',
      'billing_interval',
      'subscription_status'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // First try to update by user_id
    let { data: updatedProfile, error: updateError } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    // If no rows updated, try by id
    if (updateError && updateError.code === 'PGRST116') {
      const result = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();
      
      updatedProfile = result.data;
      updateError = result.error;
    }

    if (updateError) {
      console.error("[USER-PROFILE API] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile: " + updateError.message },
        { status: 500 },
      );
    }

    console.log(`[USER-PROFILE API] Profile updated successfully for user ${userId}`);
    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error) {
    console.error("[USER-PROFILE API] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
} 