import { createClient } from "@supabase/supabase-js";

/**
 * Creates a password reset token for the given email and returns it
 * This function uses internal Supabase APIs to generate a token without sending an email
 * @param email The email to generate a token for
 * @param redirectTo The URL to redirect to after resetting the password
 * @returns The password reset token
 */
export async function createResetToken(
  email: string,
  redirectTo: string,
): Promise<string> {
  // Get Supabase URL and service role key from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }

  // Create a new Supabase client with service role key (has admin privileges)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // Generate the token
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    if (!data || !data.properties || !data.properties.action_link) {
      throw new Error("Failed to generate reset token");
    }

    // Extract token from the action link
    const actionLink = data.properties.action_link;
    const url = new URL(actionLink);
    const token = url.searchParams.get("token");

    if (!token) {
      throw new Error("No token in generated link");
    }

    return token;
  } catch (error) {
    console.error("Error generating reset token:", error);
    throw error;
  }
}
