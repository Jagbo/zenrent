import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import { Transaction as PlaidTransaction, RemovedTransaction } from "plaid";

export async function POST(request: Request) {
  try {
    // The cookies() function needs to be awaited
    const cookieStore = cookies();
    
    // Initialize the Supabase client with the correct type
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    console.log("Exchange Token - Incoming Headers:", request.headers);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - No user found" }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const access_token = exchangeResponse.data.access_token;
    const item_id = exchangeResponse.data.item_id;

    // Store the access token and item ID in your database
    const { error: dbError } = await supabase
      .from("plaid_items" as any) // Type assertion to bypass type checking
      .insert({
        user_id: user.id,
        access_token,
        item_id,
        properties: metadata.properties,
        status: "active",
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    // Create entries in bank_connections for each property
    const propertyIds = Array.isArray(metadata.properties) ? metadata.properties : [];
    
    if (propertyIds.length === 0) {
      console.warn("No properties specified in metadata. Cannot create bank_connections entry.");
      return NextResponse.json({ success: true, warning: "No properties to connect" });
    }

    // Create bank_connections entries for each property
    const bankConnectionResults = [];
    for (const propertyId of propertyIds) {
      // Create bank_connection record
      const { data: connectionData, error: connectionError } = await supabase
        .from("bank_connections")
        .insert({
          property_id: propertyId,
          plaid_access_token: access_token,
          plaid_item_id: item_id,
        })
        .select()
        .single();

      if (connectionError) {
        console.error(`Error creating bank connection for property ${propertyId}:`, connectionError);
        bankConnectionResults.push({ propertyId, success: false, error: connectionError.message });
      } else {
        console.log(`Bank connection created for property ${propertyId}`);
        bankConnectionResults.push({ propertyId, success: true });

        // Trigger initial transaction sync for this property
        try {
          // Use Plaid's transactions/sync endpoint directly
          let added: PlaidTransaction[] = [];
          let modified: PlaidTransaction[] = [];
          let removed: RemovedTransaction[] = [];
          let hasMore = true;
          let cursor;
          
          // Process all pages of transactions
          while (hasMore) {
            const syncResponse = await plaidClient.transactionsSync({
              access_token: access_token,
              cursor: cursor,
            });
            
            const data = syncResponse.data;
            
            // Add newly received items to our result arrays
            added = [...added, ...data.added];
            modified = [...modified, ...data.modified];
            removed = [...removed, ...data.removed];
            
            hasMore = data.has_more;
            cursor = data.next_cursor;
          }

          // Process added transactions
          if (added.length > 0) {
            const transactionsToInsert = added.map((transaction) => ({
              property_id: propertyId,
              plaid_transaction_id: transaction.transaction_id,
              amount: transaction.amount,
              date: transaction.date,
              name: transaction.name,
              merchant_name: transaction.merchant_name,
              category: transaction.category,
              pending: transaction.pending,
            }));

            const { error: insertError } = await supabase
              .from("bank_transactions")
              .upsert(transactionsToInsert, { onConflict: "plaid_transaction_id" });

            if (insertError) {
              console.error("Error inserting transactions:", insertError);
            }
          }

          // Update the cursor in the database
          if (cursor) {
            const { error: cursorError } = await supabase
              .from("bank_connections")
              .update({ cursor: cursor, updated_at: new Date().toISOString() })
              .eq("property_id", propertyId);

            if (cursorError) {
              console.error("Error updating cursor:", cursorError);
            }
          }

          console.log(`Initial transaction sync for property ${propertyId} completed: ${added.length} transactions added`);
        } catch (syncError) {
          console.error(`Error syncing transactions for property ${propertyId}:`, syncError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      connections: bankConnectionResults
    });
  } catch (error: unknown) {
    // Log the full error and potential Plaid details
    console.error("Raw error object:", error);
    // Type check before accessing properties
    if (typeof error === 'object' && error !== null && 'response' in error) {
        // Check if response and response.data exist (adjust structure as needed)
        const responseData = (error as any).response?.data;
        if (responseData) {
            console.error("Plaid error details:", responseData);
        } else {
            console.error("Error has response property, but no data:", (error as any).response);
        }
    } else {
        console.error("Error does not seem to be a Plaid API error or lacks response property.");
    }
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 },
    );
  }
}
