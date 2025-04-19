import { NextResponse } from "next/server";
// Use createRouteHandlerClient for server-side routes
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { WebhookType } from "plaid";

export async function POST(request: Request) {
  try {
    // Initialize server-side Supabase client (even if user session isn't expected for webhook)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const webhookData = await request.json();

    console.log("Received Plaid webhook:", webhookData);

    // Handle different webhook types
    switch (webhookData.webhook_type) {
      case WebhookType.Auth:
        // Handle auth updates
        break;

      case WebhookType.Transactions:
        // Handle transaction updates
        if (webhookData.webhook_code === "TRANSACTIONS_SYNC") {
          // Update transactions in your database
          const { error } = await supabase.from("plaid_webhooks").insert({
            webhook_type: webhookData.webhook_type,
            webhook_code: webhookData.webhook_code,
            item_id: webhookData.item_id,
            data: webhookData,
          });

          if (error) {
            console.error("Error storing webhook:", error);
          }
        }
        break;

      default:
        console.log("Unhandled webhook type:", webhookData.webhook_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
