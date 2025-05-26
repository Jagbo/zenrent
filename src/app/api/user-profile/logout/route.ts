import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log("[LOGOUT API] Processing logout request");

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[LOGOUT API] Logout error:", error);
      return NextResponse.json(
        { error: "Failed to logout: " + error.message },
        { status: 500 },
      );
    }

    console.log("[LOGOUT API] User logged out successfully");
    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[LOGOUT API] Unexpected error:", error);
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