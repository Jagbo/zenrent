import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";
import { plaidClient } from "@/lib/plaid";
import { 
  Transaction as PlaidTransaction, 
  RemovedTransaction,
  TransactionsSyncResponse
} from "plaid";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Get the property_id from the request body
    const { property_id } = await request.json();
    if (!property_id) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    // Get the bank connection for this property
    const { data: connection, error: connectionError } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("property_id", property_id)
      .single();

    if (connectionError || !connection) {
      console.error("Connection error:", connectionError);
      return NextResponse.json({ 
        error: "Bank connection not found for this property" 
      }, { status: 404 });
    }

    // Verify user has access to this property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("user_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      console.error("Property access error:", propertyError);
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to property" }, { status: 403 });
    }

    // Use Plaid's transactions/sync endpoint
    const added: PlaidTransaction[] = [];
    const modified: PlaidTransaction[] = [];
    const removed: RemovedTransaction[] = [];
    let hasMore = true;
    let cursor = connection.cursor || undefined;
    
    // Process all pages of transactions
    while (hasMore) {
      const syncResponse = await plaidClient.transactionsSync({
        access_token: connection.plaid_access_token,
        cursor: cursor,
      });
      
      const data = syncResponse.data;
      
      // Add newly received items to our result arrays
      added.push(...data.added);
      modified.push(...data.modified);
      removed.push(...data.removed);
      
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // Process added transactions
    if (added.length > 0) {
      const transactionsToInsert = added.map((transaction) => ({
        property_id,
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
        return NextResponse.json({ error: "Failed to insert transactions" }, { status: 500 });
      }
    }

    // Process modified transactions
    if (modified.length > 0) {
      const transactionsToUpdate = modified.map((transaction) => ({
        property_id,
        plaid_transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        merchant_name: transaction.merchant_name,
        category: transaction.category,
        pending: transaction.pending,
      }));

      const { error: updateError } = await supabase
        .from("bank_transactions")
        .upsert(transactionsToUpdate, { onConflict: "plaid_transaction_id" });

      if (updateError) {
        console.error("Error updating transactions:", updateError);
        return NextResponse.json({ error: "Failed to update transactions" }, { status: 500 });
      }
    }

    // Process removed transactions
    if (removed.length > 0) {
      const transactionIdsToRemove = removed.map((transaction) => transaction.transaction_id);

      const { error: deleteError } = await supabase
        .from("bank_transactions")
        .delete()
        .in("plaid_transaction_id", transactionIdsToRemove);

      if (deleteError) {
        console.error("Error deleting transactions:", deleteError);
        return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 });
      }
    }

    // Update the cursor in the database
    if (cursor) {
      const { error: cursorError } = await supabase
        .from("bank_connections")
        .update({ 
          cursor: cursor, 
          updated_at: new Date().toISOString() 
        })
        .eq("property_id", property_id);

      if (cursorError) {
        console.error("Error updating cursor:", cursorError);
        return NextResponse.json({ error: "Failed to update cursor" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      added: added.length,
      modified: modified.length,
      removed: removed.length,
    });
  } catch (error) {
    console.error("Transaction sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 },
    );
  }
} 