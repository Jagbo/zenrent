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
    const { public_token, property_id } = await request.json();

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Store the access token and item ID in Supabase
    const { error: connectionError } = await supabase
      .from('bank_connections')
      .insert({
        property_id,
        plaid_access_token: accessToken,
        plaid_item_id: itemId,
      });

    if (connectionError) {
      throw connectionError;
    }

    // Get initial transactions
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    });

    // Store transactions in Supabase
    const transactions = transactionsResponse.data.transactions.map(transaction => ({
      property_id,
      plaid_transaction_id: transaction.transaction_id,
      amount: transaction.amount,
      date: transaction.date,
      name: transaction.name,
      merchant_name: transaction.merchant_name,
      category: transaction.category,
      pending: transaction.pending,
    }));

    const { error: transactionsError } = await supabase
      .from('bank_transactions')
      .insert(transactions);

    if (transactionsError) {
      throw transactionsError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
} 