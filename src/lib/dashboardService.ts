import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Create a Supabase client that uses service role key
const getDashboardClient = () => {
  // Use the existing supabase client that's authenticated with the user
  // This client uses the anon key and respects RLS policies
  return supabase;
};

// Get the current authenticated user ID
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("[getCurrentUserId] Auth error:", error);
      throw new Error(`Authentication error: ${error.message}`);
    }

    if (!user) {
      throw new Error("No authenticated user found");
    }

    return user.id;
  } catch (error) {
    console.error("[getCurrentUserId] Unexpected error:", error);
    throw error;
  }
};

export interface DashboardStats {
  totalProperties: number;
  expiringContracts: number;
  occupancyRate: number;
  currentMonthIncome: number;
}

export const getTotalProperties = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn("No user ID provided for getTotalProperties");
    return 0;
  }

  try {
    console.log(`[getTotalProperties] Fetching properties for user: ${userId}`);
    const { data, error } = await getDashboardClient()
      .from("properties")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      console.error("[getTotalProperties] Database error:", error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`[getTotalProperties] Found ${count} properties`);
    return count;
  } catch (error) {
    console.error("[getTotalProperties] Unexpected error:", error);
    return 0;
  }
};

export const getExpiringContracts = async (userId: string): Promise<number> => {
  if (!userId) {
    console.warn("No user ID provided for getExpiringContracts");
    return 0;
  }

  try {
    console.log(`[getExpiringContracts] Fetching for user: ${userId}`);

    // Get property IDs for this user
    const { data: properties, error: propertiesError } = await getDashboardClient()
      .from("properties")
      .select("id")
      .eq("user_id", userId);

    if (propertiesError) {
      console.error("[getExpiringContracts] Error fetching properties:", propertiesError);
      return 0;
    }

    if (!properties?.length) {
      console.log("[getExpiringContracts] No properties found");
      return 0;
    }

    const propertyIds = properties.map((p) => p.id);
    console.log(`[getExpiringContracts] Checking ${propertyIds.length} properties`);

    // Calculate date range (next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Get expiring leases
    const { data: leases, error: leasesError } = await getDashboardClient()
      .from("leases")
      .select("id")
      .in("property_id", propertyIds)
      .lte("end_date", thirtyDaysFromNow.toISOString())
      .gte("end_date", today.toISOString());

    if (leasesError) {
      console.error("[getExpiringContracts] Error fetching leases:", leasesError);
      return 0;
    }

    const count = leases?.length || 0;
    console.log(`[getExpiringContracts] Found ${count} expiring contracts`);
    return count;
  } catch (error) {
    console.error("[getExpiringContracts] Unexpected error:", error);
    return 0;
  }
};

export const getOccupancyRate = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error("User ID is required to calculate occupancy rate");
  }

  try {
    console.log(`Calculating occupancy rate for user: ${userId}`);

    // Get all properties for this user
    const { data: properties, error: propertiesError } =
      await getDashboardClient()
        .from("properties")
        .select("id")
        .eq("user_id", userId);

    if (propertiesError) {
      console.error(
        "Error fetching properties for occupancy rate:",
        propertiesError,
      );
      return 0;
    }

    if (!properties?.length) {
      console.log("No properties found for calculating occupancy rate");
      return 0;
    }

    // Get active leases for these properties
    const propertyIds = properties.map((p) => p.id);
    const { data: activeLeases, error: leasesError } =
      await getDashboardClient()
        .from("leases")
        .select("id")
        .in("property_id", propertyIds)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());

    if (leasesError) {
      console.error("Error fetching leases for occupancy rate:", leasesError);
      return 0;
    }

    const rate = Math.round(
      ((activeLeases?.length || 0) / properties.length) * 100,
    );
    console.log(`Calculated occupancy rate: ${rate}%`);
    return rate;
  } catch (error) {
    console.error("Error calculating occupancy rate:", error);
    return 0;
  }
};

export const getCurrentMonthIncome = async (
  userId: string,
): Promise<number> => {
  if (!userId) {
    throw new Error("User ID is required to calculate current month income");
  }

  try {
    console.log(`Calculating current month income for user: ${userId}`);

    // Define month range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get properties for this user
    let propertyIds: string[] = [];

    try {
      const { data: properties } = await getDashboardClient()
        .from("properties")
        .select("id")
        .eq("user_id", userId);

      if (properties && properties.length > 0) {
        propertyIds = properties.map((p) => p.id);
        console.log(
          `Found ${propertyIds.length} properties for monthly income calculation`,
        );
      } else {
        console.log(
          "No properties found for user when calculating monthly income",
        );
        return 0;
      }
    } catch (err) {
      console.error("Error fetching properties for monthly income:", err);
      return 0;
    }

    if (propertyIds.length === 0) {
      return 0;
    }

    // Get leases for these properties
    try {
      const { data } = await getDashboardClient()
        .from("leases")
        .select("rent_amount")
        .in("property_id", propertyIds)
        .lte("start_date", endOfMonth.toISOString())
        .gte("end_date", startOfMonth.toISOString());

      const income =
        data?.reduce(
          (sum, lease) => sum + (parseFloat(lease.rent_amount) || 0),
          0,
        ) || 0;
      console.log(`Calculated current month income: £${income}`);
      return income;
    } catch (err) {
      console.error("Error fetching lease data for monthly income:", err);
      return 0;
    }
  } catch (error) {
    console.error("Error calculating current month income:", error);
    return 0;
  }
};

export const getDashboardStats = async (
  userId?: string,
): Promise<DashboardStats> => {
  if (!userId) {
    try {
      userId = await getCurrentUserId();
    } catch (error) {
      console.error("[getDashboardStats] Error getting current user ID:", error);
      return getDefaultDashboardStats();
    }
  }

  console.log(`[getDashboardStats] Fetching stats for user: ${userId}`);

  try {
    const response = await fetch(`/api/dashboard?userId=${userId}`);

    if (!response.ok) {
      console.error(`[getDashboardStats] API request failed: ${response.status} ${response.statusText}`);
      return getDefaultDashboardStats();
    }

    const stats = await response.json();
    console.log("[getDashboardStats] Stats retrieved successfully:", stats);
    return stats;
  } catch (error) {
    console.error("[getDashboardStats] Unexpected error:", error);
    return getDefaultDashboardStats();
  }
};

// Helper function to return default dashboard stats
const getDefaultDashboardStats = (): DashboardStats => ({
  totalProperties: 0,
  expiringContracts: 0,
  occupancyRate: 0,
  currentMonthIncome: 0,
});

// Function to get data for dashboard charts
export const getDashboardChartData = async (userId: string) => {
  try {
    // Calculate date range (last 6 months)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5); // Get 6 months including current month
    
    // Set to beginning of first month
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    console.log(`[getDashboardChartData] Fetching chart data for user ${userId} from ${sixMonthsAgo.toISOString()} to ${today.toISOString()}`);

    // Get all properties for this user
    const { data: properties, error: propertiesError } = await getDashboardClient()
      .from('properties')
      .select('id')
      .eq('user_id', userId);

    if (propertiesError || !properties?.length) {
      console.error('[getDashboardChartData] Error fetching properties for chart data:', propertiesError);
      return getEmptyChartData();
    }

    const propertyIds = properties.map(p => p.id);
    console.log(`[getDashboardChartData] Found ${propertyIds.length} properties for user: ${propertyIds.join(', ')}`);

    console.log('[getDashboardChartData] Fetching chart data from multiple sources...');
    
    try {
      // Fetch the required data for all charts
      const [
        issuesData, 
        incomeData, 
        expensesData, 
        occupancyData,
        arrearsData
      ] = await Promise.all([
        getIssuesChartData(propertyIds, sixMonthsAgo),
        getIncomeChartData(propertyIds, sixMonthsAgo),
        getExpensesChartData(propertyIds, sixMonthsAgo),
        getOccupancyChartData(propertyIds, sixMonthsAgo),
        getArrearsChartData(propertyIds, sixMonthsAgo)
      ]);

      console.log('[getDashboardChartData] Chart data fetched successfully:',
        {
          issuesCount: issuesData.length,
          incomeCount: incomeData.length,
          expensesCount: expensesData.length,
          occupancyCount: occupancyData.length,
          arrearsCount: arrearsData.length
        }
      );

      // Calculate profit margin based on income and expenses
      const profitMarginData = calculateProfitMargin(incomeData, expensesData);

      return {
        issues: issuesData,
        income: incomeData,
        expenses: expensesData,
        profitMargin: profitMarginData,
        occupancy: occupancyData,
        arrears: arrearsData
      };
    } catch (error) {
      console.error('[getDashboardChartData] Error in Promise.all for chart data:', error);
      throw error; // Rethrow to outer catch
    }
  } catch (error) {
    console.error('[getDashboardChartData] Error getting dashboard chart data:', error);
    return getEmptyChartData();
  }
};

// Get total issues by month for the last 6 months
const getIssuesChartData = async (propertyIds: string[], startDate: Date) => {
  try {
    // Get all issues for the given property IDs within time range
    const { data: issues, error } = await getDashboardClient()
      .from('issues')
      .select('created_at')
      .in('property_id', propertyIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching issues for chart:', error);
      return getEmptyMonthlyData();
    }

    // Group issues by month
    return aggregateDataByMonth(issues, 'created_at');
  } catch (error) {
    console.error('Error in getIssuesChartData:', error);
    return getEmptyMonthlyData();
  }
};

// Get total income by month for the last 6 months
const getIncomeChartData = async (propertyIds: string[], startDate: Date) => {
  try {
    // Fetch from bank_transactions table for income data (positive amounts)
    const { data: bankTransactions, error: bankError } = await getDashboardClient()
      .from('bank_transactions')
      .select('amount, date')
      .in('property_id', propertyIds)
      .gt('amount', 0) // Only positive amounts are income
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });

    if (bankError) {
      console.error('Error fetching income data from bank_transactions:', bankError);
      return getEmptyMonthlyData();
    }

    // Group by month and sum amounts
    return aggregateAmountsByMonth(bankTransactions || []);
  } catch (error) {
    console.error('Error in getIncomeChartData:', error);
    return getEmptyMonthlyData();
  }
};

// Get total expenses by month for the last 6 months
const getExpensesChartData = async (propertyIds: string[], startDate: Date) => {
  try {
    // Fetch from bank_transactions table for expense data (negative amounts)
    const { data: bankTransactions, error: bankError } = await getDashboardClient()
      .from('bank_transactions')
      .select('amount, date')
      .in('property_id', propertyIds)
      .lt('amount', 0) // Only negative amounts are expenses
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });

    if (bankError) {
      console.error('Error fetching expense data from bank_transactions:', bankError);
      return getEmptyMonthlyData();
    }

    // Transform bank_transactions amounts (make them positive for chart display)
    const transformedTransactions = bankTransactions?.map(transaction => ({
      ...transaction,
      amount: Math.abs(Number(transaction.amount)) // Convert to positive value
    })) || [];

    // Group by month and sum amounts
    return aggregateAmountsByMonth(transformedTransactions);
  } catch (error) {
    console.error('Error in getExpensesChartData:', error);
    return getEmptyMonthlyData();
  }
};

// Calculate profit margin from income and expenses
const calculateProfitMargin = (incomeData: any[], expensesData: any[]) => {
  // Create a map of months to profit margins
  const profitMargins = new Map();
  
  // Process income data
  incomeData.forEach(item => {
    profitMargins.set(item.month, {
      income: item.value,
      expense: 0
    });
  });
  
  // Process expense data
  expensesData.forEach(item => {
    if (profitMargins.has(item.month)) {
      const data = profitMargins.get(item.month);
      data.expense = item.value;
      profitMargins.set(item.month, data);
    } else {
      profitMargins.set(item.month, {
        income: 0,
        expense: item.value
      });
    }
  });
  
  // Calculate profit margin percentages
  const result = [];
  for (const [month, data] of profitMargins.entries()) {
    const income = data.income;
    const expense = data.expense;
    let profitMargin = 0;
    
    if (income > 0) {
      profitMargin = Math.round(((income - expense) / income) * 100);
    }
    
    result.push({
      month,
      value: profitMargin
    });
  }
  
  // Sort by month
  return sortByMonth(result);
};

// Get occupancy rate by month for the last 6 months
const getOccupancyChartData = async (propertyIds: string[], startDate: Date) => {
  try {
    const totalProperties = propertyIds.length;
    if (totalProperties === 0) return getEmptyMonthlyData();
    
    // Get leases active during the period
    const { data: leases, error } = await getDashboardClient()
      .from('leases')
      .select('start_date, end_date, property_id')
      .in('property_id', propertyIds)
      .or(`start_date.lte.${new Date().toISOString()},end_date.gte.${startDate.toISOString()}`);

    if (error) {
      console.error('Error fetching leases for occupancy chart:', error);
      return getEmptyMonthlyData();
    }

    // Calculate occupancy for each month
    const monthlyData = calculateMonthlyOccupancy(leases, propertyIds, startDate);
    return monthlyData;
  } catch (error) {
    console.error('Error in getOccupancyChartData:', error);
    return getEmptyMonthlyData();
  }
};

// Calculate monthly occupancy from lease data
const calculateMonthlyOccupancy = (leases: any[], propertyIds: string[], startDate: Date) => {
  const totalProperties = propertyIds.length;
  const months = getLastSixMonths();
  const result: { month: string; value: number }[] = [];
  
  // For each month, calculate occupancy
  months.forEach(({ month, startOfMonth, endOfMonth }) => {
    // Count properties with active leases in this month
    const occupiedProperties = new Set();
    
    leases.forEach(lease => {
      const leaseStart = new Date(lease.start_date);
      const leaseEnd = new Date(lease.end_date);
      
      // Check if lease is active during this month
      if (leaseStart <= endOfMonth && leaseEnd >= startOfMonth) {
        occupiedProperties.add(lease.property_id);
      }
    });
    
    // Calculate occupancy percentage
    const occupancyRate = Math.round((occupiedProperties.size / totalProperties) * 100);
    
    result.push({
      month,
      value: occupancyRate
    });
  });
  
  return result;
};

// Get rent arrears by month for the last 6 months
const getArrearsChartData = async (propertyIds: string[], startDate: Date) => {
  try {
    // Check if the rent_payments table exists first by using a try-catch approach
    try {
      // Get all rent payments with due dates and actual payment dates
      const { data: rentPayments, error } = await getDashboardClient()
        .from('rent_payments')
        .select('amount, due_date, payment_date, status')
        .in('property_id', propertyIds)
        .gte('due_date', startDate.toISOString())
        .order('due_date', { ascending: true });

      if (error) {
        // If we get a specific error about the table not existing, handle it gracefully
        if (error.code === '42P01') {
          console.log('The rent_payments table does not exist yet. This is expected in development.');
          return getEmptyMonthlyData();
        }
        console.error('Error fetching rent arrears data:', error);
        return getEmptyMonthlyData();
      }

      // Calculate arrears by month
      return calculateMonthlyArrears(rentPayments);
    } catch (innerError) {
      console.log('Could not query rent_payments table, returning empty data:', innerError);
      return getEmptyMonthlyData();
    }
  } catch (error) {
    console.error('Error in getArrearsChartData:', error);
    return getEmptyMonthlyData();
  }
};

// Calculate monthly arrears from rent payment data
const calculateMonthlyArrears = (rentPayments: any[]) => {
  const monthlyArrears = new Map();
  const months = getLastSixMonths();
  
  // Initialize all months with zero
  months.forEach(({ month }) => {
    monthlyArrears.set(month, 0);
  });
  
  // Calculate arrears for each payment
  rentPayments.forEach(payment => {
    const dueDate = new Date(payment.due_date);
    const dueMonth = getMonthName(dueDate.getMonth());
    const isLate = payment.status === 'late' || 
                  (payment.payment_date && new Date(payment.payment_date) > new Date(payment.due_date));
    
    if (isLate && monthlyArrears.has(dueMonth)) {
      monthlyArrears.set(
        dueMonth, 
        monthlyArrears.get(dueMonth) + Number(payment.amount)
      );
    }
  });
  
  // Convert to array format
  const result = Array.from(monthlyArrears, ([month, value]) => ({ month, value }));
  return sortByMonth(result);
};

// Helper function to aggregate data by month
const aggregateDataByMonth = (data: any[], dateField: string) => {
  const monthCountMap = new Map();
  const months = getLastSixMonths();
  
  // Initialize all months with zero
  months.forEach(({ month }) => {
    monthCountMap.set(month, 0);
  });
  
  // Count items for each month
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const month = getMonthName(date.getMonth());
    
    if (monthCountMap.has(month)) {
      monthCountMap.set(month, monthCountMap.get(month) + 1);
    }
  });
  
  // Convert to array format
  const result = Array.from(monthCountMap, ([month, value]) => ({ month, value }));
  return sortByMonth(result);
};

// Helper function to aggregate financial amounts by month
const aggregateAmountsByMonth = (transactions: any[]) => {
  const monthlyAmounts = new Map();
  const months = getLastSixMonths();
  
  // Initialize all months with zero
  months.forEach(({ month }) => {
    monthlyAmounts.set(month, 0);
  });
  
  // Sum amounts for each month
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const month = getMonthName(date.getMonth());
    
    if (monthlyAmounts.has(month)) {
      monthlyAmounts.set(
        month, 
        monthlyAmounts.get(month) + Number(transaction.amount)
      );
    }
  });
  
  // Convert to array format
  const result = Array.from(monthlyAmounts, ([month, value]) => ({ month, value }));
  return sortByMonth(result);
};

// Get the last 6 months including current month
const getLastSixMonths = () => {
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(today.getMonth() - i);
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    months.push({
      month: getMonthName(date.getMonth()),
      startOfMonth,
      endOfMonth
    });
  }
  
  return months;
};

// Get month name from month index
const getMonthName = (monthIndex: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

// Sort array of objects by month
const sortByMonth = (data: any[]) => {
  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  return data.sort((a, b) => {
    return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
  });
};

// Return empty chart data structure
const getEmptyChartData = () => {
  const emptyMonthlyData = getEmptyMonthlyData();
  
  return {
    issues: emptyMonthlyData,
    income: emptyMonthlyData,
    expenses: emptyMonthlyData,
    profitMargin: emptyMonthlyData,
    occupancy: emptyMonthlyData,
    arrears: emptyMonthlyData
  };
};

// Return empty monthly data array for the last 6 months
const getEmptyMonthlyData = () => {
  const months = getLastSixMonths();
  return months.map(({ month }) => ({
    month,
    value: 0
  }));
};
