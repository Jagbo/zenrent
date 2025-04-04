import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 },
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // If newPassword is provided, this is a password reset request
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 },
        );
      }

      try {
        // Verify token using the database function
        const { data: verifyResult, error: verifyError } =
          await adminClient.rpc("validate_reset_token", {
            p_email: normalizedEmail,
            p_token: token,
          });

        if (verifyError || !verifyResult) {
          console.error("Error verifying token:", verifyError);
          return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 400 },
          );
        }

        // Get user ID using custom function
        const { data: userData, error: userError } = await adminClient.rpc(
          "query_auth_user_by_email",
          { user_email: normalizedEmail },
        );

        if (userError || !userData) {
          console.error("Error finding user:", userError);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        // Update user's password
        try {
          // Method 1: Try using adminClient for the user update
          const { error: updateError } =
            await adminClient.auth.admin.updateUserById(userData.id, {
              password: newPassword,
            });

          if (updateError) {
            console.error(
              "Error updating password with admin API:",
              updateError,
            );

            // Method 2: Try setting auth token and updating user directly
            try {
              // Get user credentials through a direct SQL function
              const { data: userCreds, error: credsError } =
                await adminClient.rpc("reset_user_password", {
                  user_id: userData.id,
                  new_password: newPassword,
                });

              if (credsError) {
                console.error("Error with direct password reset:", credsError);
                throw new Error(
                  "Failed to update password: " + credsError.message,
                );
              }

              // Password reset successful, now mark token as used
              const { data: markUsedResult, error: markUsedError } =
                await adminClient.rpc("use_reset_token", {
                  p_email: normalizedEmail,
                  p_token: token,
                });

              if (markUsedError) {
                console.error("Error marking token as used:", markUsedError);
                // Non-critical error, continue
              }

              return NextResponse.json({ success: true });
            } catch (directError) {
              console.error("Error with direct password reset:", directError);
              throw new Error("Failed to update password");
            }
          }

          // Password reset successful, now mark token as used
          const { data: markUsedResult, error: markUsedError } =
            await adminClient.rpc("use_reset_token", {
              p_email: normalizedEmail,
              p_token: token,
            });

          if (markUsedError) {
            console.error("Error marking token as used:", markUsedError);
            // Non-critical error, continue
          }

          return NextResponse.json({ success: true });
        } catch (updateError) {
          console.error("Error updating password:", updateError);
          return NextResponse.json(
            { error: "Failed to update password" },
            { status: 500 },
          );
        }
      } catch (error) {
        console.error("Error in password reset process:", error);
        return NextResponse.json(
          { error: "Failed to process password reset" },
          { status: 500 },
        );
      }
    }

    // If no newPassword provided, just verify the token
    const { data: verifyResult, error: verifyError } = await adminClient.rpc(
      "validate_reset_token",
      { p_email: normalizedEmail, p_token: token },
    );

    if (verifyError || !verifyResult) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 200 }, // Still return 200 since this is a validation check
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 },
    );
  }
}
