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

    if (!public_token) {
      return NextResponse.json(
        { error: 'Missing public_token in request' },
        { status: 400 }
      );
    }

    if (!property_id) {
      return NextResponse.json(
        { error: 'Missing property_id in request' },
        { status: 400 }
      );
    }

    console.log('Exchanging public token for access token...');
    
    // Exchange public token for access token
    try {
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
        console.error('Supabase connection error:', connectionError);
        throw connectionError;
      }

      // Get ALL historical transactions using transactions/sync
      // This is the recommended way to get all transactions for initial load
      let hasMore = true;
      let cursor = '';
      let allTransactions: any[] = [];

      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: accessToken,
          cursor: cursor || undefined,
        });

        const { added, has_more, next_cursor } = syncResponse.data;
        
        // Add new transactions to our array
        if (added && added.length > 0) {
          allTransactions = [...allTransactions, ...added];
        }
        
        // Update cursor and hasMore flag for next iteration
        cursor = next_cursor;
        hasMore = has_more;
        
        // Break if we've reached a reasonable amount to avoid timeout
        // You might need to implement pagination or background jobs for very large transaction histories
        if (allTransactions.length > 10000) {
          console.log('Reached transaction limit, stopping sync');
          break;
        }
      }

      // Format and store all retrieved transactions
      const transactions = allTransactions.map(transaction => ({
        property_id,
        plaid_transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        merchant_name: transaction.merchant_name,
        category: transaction.category,
        pending: transaction.pending,
      }));

      if (transactions.length > 0) {
        const { error: transactionsError } = await supabase
          .from('bank_transactions')
          .insert(transactions);

        if (transactionsError) {
          console.error('Error inserting transactions:', transactionsError);
          throw transactionsError;
        }
      }

      return NextResponse.json({ 
        success: true,
        transaction_count: transactions.length,
        cursor: cursor // Return cursor in case client needs to continue fetching
      });
    } catch (plaidError: any) {
      console.error('Plaid API error:', plaidError.response?.data || plaidError);
      return NextResponse.json(
        { 
          error: 'Plaid API error',
          details: plaidError.response?.data || plaidError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in exchange-token route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to exchange token',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
} 