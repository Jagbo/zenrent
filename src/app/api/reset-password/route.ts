import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Function to generate a 6-digit token
function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to store reset token in the database
async function storeResetToken(email: string, token: string) {
  // Set token expiry to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  try {
    // Check if user exists in auth.users
    const { data: userData, error: userError } = await adminClient
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();

    if (userError) {
      console.error("Error finding user:", userError);

      // Use SQL but with RPC method
      const { data: directData, error: directError } = await adminClient.rpc(
        "execute_sql",
        {
          sql: `SELECT id FROM auth.users WHERE email = '${email}' LIMIT 1`,
        },
      );

      if (directError || !directData) {
        console.error("Error finding user via direct SQL:", directError);

        // Last attempt with a raw query using postgres function
        const { data: rawQueryData, error: rawQueryError } =
          await adminClient.rpc("query_auth_user_by_email", {
            user_email: email,
          });

        if (rawQueryError || !rawQueryData) {
          console.error("Error finding user via raw query:", rawQueryError);
          throw new Error("User not found");
        }

        // Store token in reset_tokens table
        const { data, error } = await adminClient.from("reset_tokens").upsert(
          {
            user_id: rawQueryData.id,
            email,
            token,
            expires_at: expiresAt.toISOString(),
            used: false,
          },
          {
            onConflict: "email",
          },
        );

        if (error) {
          console.error("Error storing reset token:", error);
          throw error;
        }

        return true;
      }

      // Store token in reset_tokens table using direct SQL result
      const { data, error } = await adminClient.from("reset_tokens").upsert(
        {
          user_id: directData[0].id,
          email,
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
        },
        {
          onConflict: "email",
        },
      );

      if (error) {
        console.error("Error storing reset token:", error);
        throw error;
      }

      return true;
    }

    if (!userData) {
      console.error("User not found");
      throw new Error("User not found");
    }

    // Store token in reset_tokens table
    const { data, error } = await adminClient.from("reset_tokens").upsert(
      {
        user_id: userData.id,
        email,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      {
        onConflict: "email",
      },
    );

    if (error) {
      console.error("Error storing reset token:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error storing reset token:", error);
    return false;
  }
}

// Function to send password reset email with token
async function sendPasswordResetEmail(email: string, token: string) {
  try {
    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: "ZenRent <onboarding@resend.dev>",
      to: email,
      subject: "Reset your ZenRent password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Please use the following code to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${token}
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Thank you,<br/>The ZenRent Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      return false;
    }

    console.log("Reset email sent:", data);
    return true;
  } catch (error) {
    console.error("Error sending reset email:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Generate a token
    const token = generateToken();

    // Try to store token in the database
    const tokenStored = await storeResetToken(normalizedEmail, token);

    if (!tokenStored) {
      // If storing token failed, fallback to standard Supabase reset
      console.log("Token storage failed, falling back to standard reset");
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo:
          redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });
    } else {
      // Send reset email with token
      await sendPasswordResetEmail(normalizedEmail, token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset" },
      { status: 500 },
    );
  }
}
