import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Initialize the Supabase client
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Authentication failed" 
      }, { status: 401 });
    }

    // Get bank connections from the plaid_items table
    const { data: connections, error } = await supabase
      .from("plaid_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bank connections:", error);
      return NextResponse.json({ 
        error: "Failed to fetch bank connections" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      connections: connections || [] 
    });
    
  } catch (error) {
    console.error("Error in get-connections route:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 