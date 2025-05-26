import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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
      console.error("[PASSWORD API] Error getting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to get user session" },
        { status: 500 },
      );
    }

    if (!session) {
      console.warn("[PASSWORD API] No user session found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    console.log(`[PASSWORD API] Updating password for user: ${session.user.id}`);

    // First, verify the current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      console.error("[PASSWORD API] Current password verification failed:", verifyError);
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[PASSWORD API] Password update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update password: " + updateError.message },
        { status: 500 },
      );
    }

    console.log(`[PASSWORD API] Password updated successfully for user ${session.user.id}`);
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PASSWORD API] Unexpected error:", error);
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