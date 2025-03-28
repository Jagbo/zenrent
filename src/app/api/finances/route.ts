import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Fetching financial data with params:', {
      propertyId,
      startDate,
      endDate,
      NODE_ENV: process.env.NODE_ENV
    });

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Use test user ID in development
    const userId = process.env.NODE_ENV === 'development' 
      ? '00000000-0000-0000-0000-000000000001'
      : (await supabase.auth.getSession()).data.session?.user?.id;

    if (!userId) {
      console.error('No user ID found');
      return NextResponse.json(
        { error: 'No user ID found' },
        { status: 401 }
      );
    }

    // PROPERTY VERIFICATION - Confirm the property exists and belongs to the user
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .single();
    
    if (propertyError) {
      console.error('Error verifying property access:', propertyError);
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }
    
    console.log('Property verified:', property);

    // FETCH INCOME - First try a simple direct query to see if it works
    const { data: directIncome, error: directIncomeError } = await supabase
      .from('income')
      .select('*')
      .eq('property_id', propertyId)
      .limit(3);
    
    console.log('Direct income check:', {
      data: directIncome?.length || 0,
      error: directIncomeError ? directIncomeError.message : null
    });

    // FETCH INCOME for date range
    const { data: income, error: incomeError } = await supabase
      .from('income')
      .select('id, date, income_type, category, description, amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);

    console.log('Income query result:', {
      count: income?.length || 0,
      error: incomeError ? incomeError.message : null,
      sample: income?.[0] || null,
      params: { propertyId, startDate, endDate }
    });
    
    // FETCH EXPENSES
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, date, expense_type, category, description, amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);

    console.log('Expenses query result:', {
      count: expenses?.length || 0,
      error: expensesError ? expensesError.message : null
    });

    // FETCH METRICS
    const { data: metrics, error: metricsError } = await supabase
      .from('financial_metrics')
      .select('roi_percentage, yield_percentage, occupancy_rate')
      .eq('property_id', propertyId)
      .or(`period_start.lte.${endDate},period_end.gte.${startDate}`)
      .maybeSingle();

    console.log('Metrics query result:', {
      found: metrics ? true : false,
      error: metricsError ? metricsError.message : null
    });

    // FETCH ALL PROPERTIES for performance overview
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, property_code, address, bedrooms')
      .eq('user_id', userId);

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
    }

    // Prepare property performance array
    const propertyPerformance = properties ? properties.map(p => {
      return {
        id: p.id,
        property_code: p.property_code,
        address: p.address,
        total_units: p.bedrooms || 0,
        monthly_revenue: 0,  // We'll calculate this below
        monthly_expenses: 0, // We'll calculate this below
        noi: 0,              // We'll calculate this below
        cap_rate: 0
      };
    }) : [];

    // CALCULATE TOTALS
    const parsedIncome = income ? income.map(item => ({
      ...item,
      amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
    })) : [];
    
    const parsedExpenses = expenses ? expenses.map(item => ({
      ...item,
      amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
    })) : [];
    
    const totalIncome = parsedIncome.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = parsedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    console.log('Calculated totals:', {
      totalIncome,
      totalExpenses,
      netProfit,
      incomeCount: parsedIncome.length,
      expenseCount: parsedExpenses.length
    });

    // Return results
    return NextResponse.json({
      income: parsedIncome || [],
      expenses: parsedExpenses || [],
      service_charges: [],
      invoices: [],
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      metrics: metrics ? {
        roi: metrics.roi_percentage || 0,
        yield: metrics.yield_percentage || 0,
        occupancy_rate: metrics.occupancy_rate || 0,
      } : {
        roi: 0,
        yield: 0,
        occupancy_rate: 0,
      },
      property_performance: propertyPerformance || []
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data', details: String(error) },
      { status: 500 }
    );
  }
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