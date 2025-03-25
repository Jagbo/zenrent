import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const webhook = await request.json();

    // Handle different webhook types
    switch (webhook.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhook);
        break;
      // Add other webhook types as needed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleTransactionsWebhook(webhook: any) {
  // Get the item_id from the webhook
  const itemId = webhook.item_id;

  // Find the bank connection with this item_id
  const { data: connection } = await supabase
    .from('bank_connections')
    .select('plaid_access_token, property_id, cursor')
    .eq('plaid_item_id', itemId)
    .single();

  if (!connection) {
    throw new Error('Bank connection not found');
  }

  // Get the stored cursor (if any)
  let cursor = connection.cursor || '';
  let hasMore = true;
  let added: any[] = [];
  let modified: any[] = [];
  let removed: any[] = [];
  
  // Sync new transactions using transactions/sync
  while (hasMore) {
    const syncResponse = await plaidClient.transactionsSync({
      access_token: connection.plaid_access_token,
      cursor: cursor || undefined,
    });
    
    const { 
      added: newAdded, 
      modified: newModified, 
      removed: newRemoved, 
      has_more, 
      next_cursor 
    } = syncResponse.data;
    
    // Add new transactions to our arrays
    if (newAdded && newAdded.length > 0) {
      added = [...added, ...newAdded];
    }
    
    if (newModified && newModified.length > 0) {
      modified = [...modified, ...newModified];
    }
    
    if (newRemoved && newRemoved.length > 0) {
      removed = [...removed, ...newRemoved];
    }
    
    // Update cursor and hasMore flag for next iteration
    cursor = next_cursor;
    hasMore = has_more;
    
    // Break if we've reached a reasonable amount to avoid timeout
    if (added.length + modified.length > 1000) {
      break;
    }
  }
  
  // Store the updated cursor
  await supabase
    .from('bank_connections')
    .update({ cursor: cursor })
    .eq('plaid_item_id', itemId);
  
  // Process transactions in batches if needed
  
  // 1. Insert new transactions
  if (added.length > 0) {
    const newTransactions = added.map(transaction => ({
      property_id: connection.property_id,
      plaid_transaction_id: transaction.transaction_id,
      amount: transaction.amount,
      date: transaction.date,
      name: transaction.name,
      merchant_name: transaction.merchant_name,
      category: transaction.category,
      pending: transaction.pending,
    }));
    
    await supabase
      .from('bank_transactions')
      .insert(newTransactions);
  }
  
  // 2. Update modified transactions
  if (modified.length > 0) {
    for (const transaction of modified) {
      await supabase
        .from('bank_transactions')
        .update({
          amount: transaction.amount,
          date: transaction.date,
          name: transaction.name,
          merchant_name: transaction.merchant_name,
          category: transaction.category,
          pending: transaction.pending,
        })
        .eq('plaid_transaction_id', transaction.transaction_id);
    }
  }
  
  // 3. Remove deleted transactions
  if (removed.length > 0) {
    const removedIds = removed.map(transaction => transaction.transaction_id);
    await supabase
      .from('bank_transactions')
      .delete()
      .in('plaid_transaction_id', removedIds);
  }
} 