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
    .select('plaid_access_token, property_id')
    .eq('plaid_item_id', itemId)
    .single();

  if (!connection) {
    throw new Error('Bank connection not found');
  }

  // Get new transactions from Plaid
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const transactionsResponse = await plaidClient.transactionsGet({
    access_token: connection.plaid_access_token,
    start_date: thirtyDaysAgo.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
  });

  // Format transactions for insertion
  const transactions = transactionsResponse.data.transactions.map(transaction => ({
    property_id: connection.property_id,
    plaid_transaction_id: transaction.transaction_id,
    amount: transaction.amount,
    date: transaction.date,
    name: transaction.name,
    merchant_name: transaction.merchant_name,
    category: transaction.category,
    pending: transaction.pending,
  }));

  // Upsert transactions (insert new ones, update existing ones)
  const { error } = await supabase
    .from('bank_transactions')
    .upsert(transactions, {
      onConflict: 'plaid_transaction_id',
    });

  if (error) {
    throw error;
  }
} 