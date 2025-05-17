import { supabase } from "./supabase";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export interface PlaidTransaction {
  id: number;
  property_id: string;
  plaid_transaction_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  pending: boolean;
  created_at: string;
}

interface TransactionOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Initialize configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.NEXT_PUBLIC_PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.NEXT_PUBLIC_PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Get transactions for a specific property
 *
 * @param propertyId The property ID to get transactions for
 * @param options Optional filtering options
 * @returns An array of transactions and total count
 */
export async function getPropertyTransactions(
  propertyId: string,
  options: TransactionOptions = {},
): Promise<{ transactions: PlaidTransaction[]; count: number }> {
  const { startDate, endDate, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("bank_transactions")
    .select("*", { count: "exact" })
    .eq("property_id", propertyId)
    .order("date", { ascending: false });

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Error fetching transactions: ${error.message}`);
  }

  return {
    transactions: data as PlaidTransaction[],
    count: count || 0,
  };
}

/**
 * Get summary of transactions for a property (total income, expenses, etc.)
 *
 * @param propertyId The property ID to get transaction summary for
 * @param startDate Optional start date for filtering
 * @param endDate Optional end date for filtering
 * @returns Summary of transactions
 */
export async function getTransactionsSummary(
  propertyId: string,
  startDate?: string,
  endDate?: string,
): Promise<{ income: number; expenses: number; netFlow: number }> {
  let query = supabase
    .from("bank_transactions")
    .select("amount")
    .eq("property_id", propertyId);

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching transaction summary: ${error.message}`);
  }

  // In Plaid, expenses are positive amounts and income/deposits are negative
  // We'll invert these for better readability in our UI
  const income = data
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const expenses = data
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    income,
    expenses,
    netFlow: income - expenses,
  };
}

/**
 * Check if a property has a linked bank account
 *
 * @param propertyId The property ID to check
 * @returns True if a bank account is linked, false otherwise
 */
export async function hasLinkedBankAccount(
  propertyId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bank_connections")
    .select("id")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error || !data) {
    console.log(`No bank connection found for property ${propertyId}`);
    return false;
  }

  return true;
}
