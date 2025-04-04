import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  try {
    const supabase = createClientComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const access_token = exchangeResponse.data.access_token;
    const item_id = exchangeResponse.data.item_id;

    // Store the access token and item ID in your database
    const { error: dbError } = await supabase.from("plaid_items").insert({
      user_id: user.id,
      access_token,
      item_id,
      properties: metadata.properties,
      status: "active",
    });

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error exchanging token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 },
    );
  }
}
