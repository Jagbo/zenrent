import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { FinancialData } from '@/types/finances';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { PropertySelector } from '@/components/finances/PropertySelector';

export function FinancialOverview() {
  const { propertyId } = useSelectedProperty();

  const { data, isLoading } = useQuery<FinancialData>({
    queryKey: ['finances', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      // Use fixed date range for development to match our test data
      const startDate = process.env.NODE_ENV === 'development' 
        ? '2024-10-01' 
        : new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
      
      const endDate = process.env.NODE_ENV === 'development'
        ? '2025-03-31'
        : new Date().toISOString().split('T')[0];
      
      console.log('FinancialOverview fetching with params:', {
        propertyId,
        startDate,
        endDate,
        NODE_ENV: process.env.NODE_ENV
      });
      
      const response = await fetch(`/api/finances?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        console.error('Failed to fetch financial data:', response.status, response.statusText);
        throw new Error('Failed to fetch financial data');
      }
      
      const result = await response.json();
      console.log('FinancialOverview received data:', {
        income: result.income?.length || 0,
        expenses: result.expenses?.length || 0,
        firstIncomeItem: result.income?.[0] || null
      });
      
      // If we're in development mode and the result has no income/expenses, return sample data
      if (process.env.NODE_ENV === 'development' && 
          (!result.income || result.income.length === 0)) {
        console.log('Using fallback sample data for development');
        
        // Sample income data
        const sampleIncome = [
          { id: '1', date: '2024-10-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
          { id: '2', date: '2024-11-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
          { id: '3', date: '2024-12-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
          { id: '4', date: '2025-01-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
          { id: '5', date: '2025-02-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
          { id: '6', date: '2025-03-28', income_type: 'Rent', category: 'Monthly Rent', description: 'Monthly rental income', amount: 2000 },
        ];
        
        // Sample expense data
        const sampleExpenses = [
          { id: '1', date: '2024-10-28', expense_type: 'Maintenance', category: 'Repairs', description: 'Regular maintenance', amount: 300 },
          { id: '2', date: '2024-11-28', expense_type: 'Utilities', category: 'Electricity', description: 'Monthly electricity bill', amount: 150 },
          { id: '3', date: '2024-12-28', expense_type: 'Maintenance', category: 'Repairs', description: 'Regular maintenance', amount: 300 },
          { id: '4', date: '2025-01-28', expense_type: 'Utilities', category: 'Electricity', description: 'Monthly electricity bill', amount: 150 },
          { id: '5', date: '2025-02-28', expense_type: 'Maintenance', category: 'Repairs', description: 'Regular maintenance', amount: 300 },
          { id: '6', date: '2025-03-28', expense_type: 'Utilities', category: 'Electricity', description: 'Monthly electricity bill', amount: 150 },
        ];
        
        const totalIncome = sampleIncome.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = sampleExpenses.reduce((sum, item) => sum + item.amount, 0);
        
        return {
          ...result,
          income: sampleIncome,
          expenses: sampleExpenses,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_profit: totalIncome - totalExpenses,
          metrics: {
            roi: 15.5,
            yield: 7.2,
            occupancy_rate: 95
          }
        };
      }
      
      return result;
    },
    enabled: !!propertyId,
  });

  if (!propertyId) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground">Select a property to view financial data</p>
        <PropertySelector />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="mb-4">
          <PropertySelector />
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm md:text-base">Total Income</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm md:text-base">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm md:text-base">Net Profit</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm md:text-base">ROI</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const totalIncome = data?.income?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalExpenses = data?.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const netProfit = totalIncome - totalExpenses;

  return (
    <>
      <div className="mb-4">
        <PropertySelector />
      </div>
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <Card className="w-full">
          <CardHeader className="p-4">
            <CardTitle className="text-sm md:text-base">Total Income</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="p-4">
            <CardTitle className="text-sm md:text-base">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="p-4">
            <CardTitle className="text-sm md:text-base">Net Profit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-lg md:text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="p-4">
            <CardTitle className="text-sm md:text-base">ROI</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {data?.metrics?.roi ? `${data.metrics.roi.toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 