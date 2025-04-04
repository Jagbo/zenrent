import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Basic property type
interface Property {
  id: string;
  property_code: string | null;
  address: string | null;
  property_type: string | null;
  bedrooms: number | null;
}

export async function GET() {
  try {
    console.log("[DEV-PROPERTIES] Using service role to fetch test properties");

    // Test user ID
    const testUserId = "00000000-0000-0000-0000-000000000001";

    // Create service role client (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    // Query properties directly
    const { data: properties, error } = await supabaseAdmin
      .from("properties")
      .select("id, property_code, address, property_type, bedrooms")
      .eq("user_id", testUserId);

    // Log results
    console.log("[DEV-PROPERTIES] Query result:", {
      success: !error,
      count: properties?.length || 0,
      error: error?.message || null,
    });

    // Handle errors
    if (error) {
      console.error("[DEV-PROPERTIES] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle no properties
    if (!properties || properties.length === 0) {
      console.warn("[DEV-PROPERTIES] No properties found");
      return NextResponse.json([]);
    }

    // Transform for frontend
    const result = properties.map((property: Property) => ({
      id: property.id,
      property_code: property.property_code,
      address: property.address,
      type: property.property_type,
      total_units: property.bedrooms,
    }));

    console.log("[DEV-PROPERTIES] Returning properties:", result.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[DEV-PROPERTIES] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
