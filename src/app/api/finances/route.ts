import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    const propertyId = url.searchParams.get('propertyId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    console.log('[FINANCES API] Request parameters:', { propertyId, startDate, endDate });
    
    // Create Supabase client with service role in development to bypass RLS
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NODE_ENV === 'development' 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        auth: { 
          persistSession: false 
        } 
      }
    );
    
    // In development mode, use the test user ID
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // If propertyId is provided, fetch data for that specific property
    if (propertyId) {
      return await getFinancialDataForProperty(supabaseClient, propertyId, startDate, endDate);
    }
    
    // If no propertyId provided, fetch all properties for the user
    let propertiesQuery = supabaseClient
      .from('properties')
      .select('*');
      
    // In development mode, use test user ID
    if (process.env.NODE_ENV === 'development') {
      propertiesQuery = propertiesQuery.eq('user_id', testUserId);
    }
    
    const { data: properties, error: propertiesError } = await propertiesQuery;
    
    if (propertiesError) {
      console.error('[FINANCES API] Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }
    
    if (!properties || properties.length === 0) {
      console.warn('[FINANCES API] No properties found for user');
      return NextResponse.json(
        { 
          properties: [],
          total_income: 0,
          total_expenses: 0,
          net_profit: 0
        },
        { status: 200 }
      );
    }
    
    console.log(`[FINANCES API] Found ${properties.length} properties`);
    
    // Fetch financial data for each property in parallel
    const propertiesData = await Promise.all(
      properties.map(async (property) => {
        try {
          // Get financial data for this property
          const response = await getFinancialDataForProperty(supabaseClient, property.id, startDate, endDate);
          // Convert response to json
          const data = await response.json();
          // Add property details to the financial data
          return {
            property_id: property.id,
            property_address: property.address,
            property_code: property.property_code,
            ...data
          };
        } catch (error) {
          console.error(`[FINANCES API] Error fetching data for property ${property.id}:`, error);
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
              occupancy_rate: 0
            }
          };
        }
      })
    );
    
    // Calculate totals across all properties
    const totalIncome = propertiesData.reduce((sum, data) => sum + (data.total_income || 0), 0);
    const totalExpenses = propertiesData.reduce((sum, data) => sum + (data.total_expenses || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Create aggregated response
    const aggregatedResponse = {
      properties: propertiesData,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: netProfit
    };
    
    console.log('[FINANCES API] Successfully fetched financial data for all properties');
    return NextResponse.json(aggregatedResponse);
    
  } catch (error) {
    console.error('[FINANCES API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Helper function to get financial data for a specific property
async function getFinancialDataForProperty(supabaseClient: SupabaseClient, propertyId: string, startDate: string | null, endDate: string | null) {
  // Get property for inclusion in response
  const { data: property, error: propertyError } = await supabaseClient
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();
  
  if (propertyError || !property) {
    console.error('[FINANCES API] Error fetching property:', propertyError || 'Property not found');
    return NextResponse.json(
      { error: 'Property not found or access denied' },
      { status: 404 }
    );
  }
  
  console.log(`[FINANCES API] Found property with ID:`, propertyId);
  
  // Build query for income data - property_id is the UUID in the income and expense tables
  let incomeQuery = supabaseClient
    .from('income')
    .select('*')
    .eq('property_id', propertyId)
    .order('date', { ascending: false });
  
  console.log(`[FINANCES API] Querying income with property_id:`, propertyId);
  
  // Add date filters if provided
  if (startDate) {
    incomeQuery = incomeQuery.gte('date', startDate);
  }
  
  if (endDate) {
    incomeQuery = incomeQuery.lte('date', endDate);
  }
  
  // Execute income query
  const { data: income, error: incomeError } = await incomeQuery;
  
  if (incomeError) {
    console.error('[FINANCES API] Income fetch error:', incomeError);
  } else {
    console.log(`[FINANCES API] Found ${income?.length || 0} income records`);
  }
  
  // Build query for expense data
  let expenseQuery = supabaseClient
    .from('expenses')
    .select('*')
    .eq('property_id', propertyId)
    .order('date', { ascending: false });
  
  console.log(`[FINANCES API] Querying expenses with property_id:`, propertyId);
  
  // Add date filters if provided
  if (startDate) {
    expenseQuery = expenseQuery.gte('date', startDate);
  }
  
  if (endDate) {
    expenseQuery = expenseQuery.lte('date', endDate);
  }
  
  // Execute expense query
  const { data: expenses, error: expensesError } = await expenseQuery;
  
  if (expensesError) {
    console.error('[FINANCES API] Expenses fetch error:', expensesError);
  } else {
    console.log(`[FINANCES API] Found ${expenses?.length || 0} expense records`);
  }
  
  // Calculate totals
  const totalIncome = (income || []).reduce((sum: number, item: Income) => sum + Number(item.amount), 0);
  const totalExpenses = (expenses || []).reduce((sum: number, item: Expense) => sum + Number(item.amount), 0);
  
  // Create transactions array
  const transactions: Transaction[] = [
    ...(income || []).map((inc: Income) => ({
      id: inc.id,
      date: inc.date,
      type: 'Income',
      category: inc.income_type,
      description: inc.description,
      property: property.address,
      amount: Number(inc.amount),
      status: 'Completed'
    })),
    ...(expenses || []).map((exp: Expense) => ({
      id: exp.id,
      date: exp.date,
      type: 'Expense',
      category: exp.expense_type,
      description: exp.description,
      property: property.address,
      amount: -Number(exp.amount),
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
    net_profit: totalIncome - totalExpenses,
    metrics: {
      roi: 8.5, // Placeholder - would calculate from real data
      yield: 6.2, // Placeholder - would calculate from real data
      occupancy_rate: 95 // Placeholder - would calculate from real data
    },
    property_performance: [{
      id: propertyId,
      address: property.address,
      total_units: property.bedrooms || 1,
      monthly_revenue: totalIncome / 6,
      monthly_expenses: totalExpenses / 6,
      noi: (totalIncome - totalExpenses) / 6,
      cap_rate: 7.2
    }]
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
      .from('properties')
      .select('id')
      .eq('id', data.property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 403 }
      );
    }

    let result;

    switch (type) {
      case 'expense':
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .insert([data])
          .select()
          .single();
        if (expenseError) throw expenseError;
        result = expense;
        break;

      case 'income':
        const { data: income, error: incomeError } = await supabase
          .from('income')
          .insert([data])
          .select()
          .single();
        if (incomeError) throw incomeError;
        result = income;
        break;

      case 'service-charge':
        const { data: serviceCharge, error: serviceChargeError } = await supabase
          .from('service_charges')
          .insert([data])
          .select()
          .single();
        if (serviceChargeError) throw serviceChargeError;
        result = serviceCharge;
        break;

      case 'invoice':
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([data])
          .select()
          .single();
        if (invoiceError) throw invoiceError;
        result = invoice;
        break;

      default:
        throw new Error('Invalid type specified');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating financial record:', error);
    return NextResponse.json(
      { error: 'Failed to create financial record' },
      { status: 500 }
    );
  }
} 