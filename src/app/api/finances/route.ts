import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface Expense {
  id: string;
  date: string;
  expense_type: string;
  category: string;
  description: string;
  amount: number;
}

interface Income {
  id: string;
  date: string;
  income_type: string;
  category: string;
  description: string;
  amount: number;
}

interface ServiceCharge {
  id: string;
  date: string;
  type: string;
  description: string;
  status: string;
  amount: number;
}

interface Invoice {
  id: string;
  date: string;
  invoice_number: string;
  description: string;
  status: string;
  amount: number;
}

interface FinancialMetrics {
  roi_percentage: number;
  yield_percentage: number;
  occupancy_rate: number;
}

// Transaction type
interface Transaction {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  property: string;
  amount: number;
  status: string;
}

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    console.log("[FINANCES API] Request received:", {
      url: request.url,
      propertyId,
      startDate,
      endDate,
    });

    // Create Supabase client that respects RLS using Auth Helpers
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[FINANCES API] Error getting session:", sessionError);
      return NextResponse.json(
        { error: "Failed to get user session" },
        { status: 500 },
      );
    }

    if (!session) {
      console.warn("[FINANCES API] No user session found");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    console.log("[FINANCES API] User ID:", userId);

    // If propertyId is provided, fetch data for that specific property
    if (propertyId) {
      return await getFinancialDataForProperty(
        supabase,
        userId,
        propertyId,
        startDate,
        endDate,
      );
    }

    // If no propertyId provided, fetch all properties for the user
    const propertiesQuery = supabase
      .from("properties")
      .select("*")
      .eq("user_id", userId); // Filter by the actual user ID

    const { data: properties, error: propertiesError } = await propertiesQuery;

    if (propertiesError) {
      console.error(
        "[FINANCES API] Error fetching properties:",
        propertiesError,
      );
      return NextResponse.json(
        { error: "Failed to fetch properties" },
        { status: 500 },
      );
    }

    if (!properties || properties.length === 0) {
      console.warn("[FINANCES API] No properties found for user");
      return NextResponse.json(
        {
          properties: [],
          total_income: 0,
          total_expenses: 0,
          net_profit: 0,
        },
        { status: 200 },
      );
    }

    console.log(`[FINANCES API] Found ${properties.length} properties`);

    // Fetch financial data for each property in parallel
    const propertiesData = await Promise.all(
      properties.map(async (property) => {
        try {
          // Get financial data for this property using the RLS-enabled client
          const response = await getFinancialDataForProperty(
            supabase,
            userId,
            property.id,
            startDate,
            endDate,
          );
          // Convert response to json
          const data = await response.json();
          // Add property details to the financial data
          return {
            property_id: property.id,
            property_address: property.address,
            property_code: property.property_code,
            ...data,
          };
        } catch (error) {
          console.error(
            `[FINANCES API] Error fetching data for property ${property.id}:`,
            error,
          );
          return {
            property_id: property.id,
            property_address: property.address,
            property_code: property.property_code,
            error: `Failed to fetch financial data: ${error instanceof Error ? error.message : String(error)}`,
            income: [],
            expenses: [],
            transactions: [],
            service_charges: [],
            invoices: [],
            total_income: 0,
            total_expenses: 0,
            net_profit: 0,
            metrics: {
              roi: 0,
              yield: 0,
              occupancy_rate: 0,
            },
          };
        }
      }),
    );

    // Calculate totals across all properties
    const totalIncome = propertiesData.reduce(
      (sum, data) => sum + (data.total_income || 0),
      0,
    );
    const totalExpenses = propertiesData.reduce(
      (sum, data) => sum + (data.total_expenses || 0),
      0,
    );
    const netProfit = totalIncome - totalExpenses;

    // Create aggregated response
    const aggregatedResponse = {
      properties: propertiesData,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: netProfit,
    };

    console.log(
      "[FINANCES API] Successfully fetched financial data for all properties",
    );
    return NextResponse.json(aggregatedResponse);
  } catch (error) {
    console.error("[FINANCES API] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch financial data: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}

// Helper function to get financial data for a specific property
async function getFinancialDataForProperty(
  supabaseClient: SupabaseClient,
  userId: string,
  propertyId: string,
  startDate: string | null,
  endDate: string | null,
) {
  console.log("[getFinancialDataForProperty] Starting with params:", {
    userId,
    propertyId,
    startDate,
    endDate,
  });

  // Get property details including valuation and purchase data
  const { data: property, error: propertyError } = await supabaseClient
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    console.error('[FINANCES API] Error fetching property:', propertyError);
    throw new Error('Failed to fetch property details');
  }

  console.log('[getFinancialDataForProperty] Property fetched:', property);

  // NEW APPROACH: Fetch transactions directly from bank_transactions table
  let transactionsQuery = supabaseClient
    .from('bank_transactions')
    .select('*')
    .eq('property_id', propertyId);

  // Only apply date filters if specified
  if (startDate) {
    transactionsQuery = transactionsQuery.gte('date', startDate);
  }
  
  if (endDate) {
    transactionsQuery = transactionsQuery.lte('date', endDate);
  }

  // Order by date descending (newest first)
  transactionsQuery = transactionsQuery.order('date', { ascending: false });

  const { data: bankTransactions, error: transactionsError } = await transactionsQuery;

  if (transactionsError) {
    console.error('[FINANCES API] Error fetching bank transactions:', transactionsError);
    throw new Error('Failed to fetch transaction data');
  }

  console.log(`[getFinancialDataForProperty] Fetched ${bankTransactions?.length || 0} bank transactions`);

  // Transform bank_transactions into our expected transaction format
  const transactions = bankTransactions?.map(transaction => ({
    id: transaction.id,
    date: transaction.date,
    type: parseFloat(transaction.amount) >= 0 ? 'Income' : 'Expense',
    category: Array.isArray(transaction.category) ? transaction.category[0] : 'Uncategorized',
    description: transaction.name || '',
    property: property.address,
    amount: parseFloat(transaction.amount),
    status: transaction.pending ? 'Pending' : 'Completed'
  })) || [];

  // Calculate total income and expenses from the bank transactions
  const totalIncome = bankTransactions?.reduce((sum, item) => {
    const amount = parseFloat(item.amount);
    return sum + (amount > 0 ? amount : 0);
  }, 0) || 0;

  const totalExpenses = bankTransactions?.reduce((sum, item) => {
    const amount = parseFloat(item.amount);
    return sum + (amount < 0 ? Math.abs(amount) : 0);
  }, 0) || 0;

  const netOperatingIncome = totalIncome - totalExpenses;

  // Keep the rest of the calculations
  // Calculate monthly averages - using 6 months as default period if no dates provided
  const monthSpan = 6; // Default to 6 months if no date range specified
  const monthlyRevenue = totalIncome / monthSpan;
  const monthlyExpenses = totalExpenses / monthSpan;
  const monthlyNOI = netOperatingIncome / monthSpan;

  // Calculate Cap Rate using current valuation
  const propertyValue = parseFloat(property.current_valuation) || parseFloat(property.purchase_price) || 0;
  const annualizedNOI = monthlyNOI * 12;
  const capRate = propertyValue > 0 ? (annualizedNOI / propertyValue) * 100 : 0;

  // Calculate ROI using purchase price
  const purchasePrice = parseFloat(property.purchase_price) || 0;
  const roi = purchasePrice > 0 ? (annualizedNOI / purchasePrice) * 100 : 0;

  // Calculate Yield
  const yieldRate = propertyValue > 0 ? ((totalIncome * (12 / monthSpan)) / propertyValue) * 100 : 0;

  // Calculate Occupancy Rate (simplified)
  const occupancyRate = 100; // Default to 100% if no leases found

  // Build and return the financial data
  const financialData = {
    income: [], // Empty as we're not using the income table
    expenses: [], // Empty as we're not using the expenses table
    transactions, // Use our transformed transactions from bank_transactions
    service_charges: [],
    invoices: [],
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: netOperatingIncome,
    metrics: {
      roi: parseFloat(roi.toFixed(1)),
      yield: parseFloat(yieldRate.toFixed(1)),
      occupancy_rate: parseFloat(occupancyRate.toFixed(1)),
    },
    property_performance: [
      {
        id: propertyId,
        address: property.address,
        total_units: property.bedrooms || 1,
        monthly_revenue: monthlyRevenue,
        monthly_expenses: monthlyExpenses,
        noi: monthlyNOI,
        cap_rate: parseFloat(capRate.toFixed(1)),
      },
    ],
  };

  console.log('[FINANCES API] Successfully fetched financial data');
  return NextResponse.json(financialData);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const body = await request.json();
  const { type, data } = body;

  try {
    // First verify that the property belongs to the user
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", data.property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 403 },
      );
    }

    let result;

    switch (type) {
      case "expense":
        const { data: expense, error: expenseError } = await supabase
          .from("expenses")
          .insert([data])
          .select()
          .single();
        if (expenseError) throw expenseError;
        result = expense;
        break;

      case "income":
        const { data: income, error: incomeError } = await supabase
          .from("income")
          .insert([data])
          .select()
          .single();
        if (incomeError) throw incomeError;
        result = income;
        break;

      case "service-charge":
        const { data: serviceCharge, error: serviceChargeError } =
          await supabase
            .from("service_charges")
            .insert([data])
            .select()
            .single();
        if (serviceChargeError) throw serviceChargeError;
        result = serviceCharge;
        break;

      case "invoice":
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert([data])
          .select()
          .single();
        if (invoiceError) throw invoiceError;
        result = invoice;
        break;

      default:
        throw new Error("Invalid type specified");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating financial record:", error);
    return NextResponse.json(
      { error: "Failed to create financial record" },
      { status: 500 },
    );
  }
}
