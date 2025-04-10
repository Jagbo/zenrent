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

  // Get income transactions
  const incomeQuery = supabaseClient
    .from('income')
    .select('*')
    .eq('property_id', propertyId)
    .gte('date', startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0])
    .lte('date', endDate || new Date().toISOString().split('T')[0]);

  console.log('[getFinancialDataForProperty] Income query params:', {
    property_id: propertyId,
    start_date: startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end_date: endDate || new Date().toISOString().split('T')[0]
  });

  const { data: income, error: incomeError } = await incomeQuery;

  if (incomeError) {
    console.error('[FINANCES API] Error fetching income:', incomeError);
    throw new Error('Failed to fetch income data');
  }

  console.log('[getFinancialDataForProperty] Income fetched:', income);

  // Get expense transactions
  const { data: expenses, error: expensesError } = await supabaseClient
    .from('expenses')
    .select('*')
    .eq('property_id', propertyId)
    .gte('date', startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0])
    .lte('date', endDate || new Date().toISOString().split('T')[0]);

  if (expensesError) {
    console.error('[FINANCES API] Error fetching expenses:', expensesError);
    throw new Error('Failed to fetch expense data');
  }

  // Get tenancy data for occupancy calculation
  const { data: tenancies, error: tenanciesError } = await supabaseClient
    .from('leases')
    .select('*')
    .eq('property_id', propertyId)
    .gte('start_date', startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0])
    .lte('end_date', endDate || new Date().toISOString().split('T')[0]);

  if (tenanciesError) {
    console.error('[FINANCES API] Error fetching tenancies:', tenanciesError);
    // Don't throw error, just log it and continue with 0 occupancy
  }

  // Calculate total income and expenses
  const totalIncome = income?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
  const netOperatingIncome = totalIncome - totalExpenses;

  // Calculate monthly averages
  const monthlyRevenue = totalIncome / 6; // Assuming 6 months of data
  const monthlyExpenses = totalExpenses / 6;
  const monthlyNOI = netOperatingIncome / 6;

  // Calculate Cap Rate using current valuation
  const propertyValue = parseFloat(property.current_valuation) || parseFloat(property.purchase_price) || 0;
  const annualizedNOI = monthlyNOI * 12;
  const capRate = propertyValue > 0 ? (annualizedNOI / propertyValue) * 100 : 0;

  // Calculate ROI using purchase price
  const purchasePrice = parseFloat(property.purchase_price) || 0;
  const roi = purchasePrice > 0 ? (annualizedNOI / purchasePrice) * 100 : 0;

  // Calculate Yield
  const annualizedIncome = monthlyRevenue * 12;
  const yieldRate = propertyValue > 0 ? (annualizedIncome / propertyValue) * 100 : 0;

  // Calculate Occupancy Rate
  let occupancyRate = 0;
  if (tenancies && tenancies.length > 0) {
    const totalDays = ((new Date(endDate || new Date())).getTime() - (new Date(startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)))).getTime()) / (1000 * 60 * 60 * 24);
    const occupiedDays = tenancies.reduce((total, tenancy) => {
      const start = Math.max(new Date(tenancy.start_date).getTime(), new Date(startDate || new Date(new Date().setMonth(new Date().getMonth() - 6))).getTime());
      const end = Math.min(new Date(tenancy.end_date).getTime(), new Date(endDate || new Date()).getTime());
      const days = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
      return total + days;
    }, 0);
    occupancyRate = (occupiedDays / totalDays) * 100;
  }

  // Combine transactions for the timeline
  const transactions = [
    ...(income || []).map(inc => ({
      id: inc.id,
      date: inc.date,
      type: 'Income',
      category: inc.income_type,
      description: inc.description,
      property: property.address,
      amount: parseFloat(inc.amount),
      status: 'Completed'
    })),
    ...(expenses || []).map(exp => ({
      id: exp.id,
      date: exp.date,
      type: 'Expense',
      category: exp.expense_type,
      description: exp.description,
      property: property.address,
      amount: -parseFloat(exp.amount),
      status: 'Completed'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Build and return the financial data
  const financialData = {
    income: income || [],
    expenses: expenses || [],
    transactions,
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
