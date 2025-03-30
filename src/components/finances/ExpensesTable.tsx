'use client';

import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export function ExpensesTable() {
  const { propertyId } = useSelectedProperty();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      // Use fixed date range for development to match our test data
      const startDate = process.env.NODE_ENV === 'development' 
        ? '2024-10-01' 
        : new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
      
      const endDate = process.env.NODE_ENV === 'development'
        ? '2025-03-31'
        : new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/finances?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses data');
      }
      
      const data = await response.json();
      return data.expenses || [];
    },
    enabled: !!propertyId,
  });

  if (!propertyId) return null;
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div>Loading expenses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((expense: any) => (
              <div key={expense.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-gray-500">{expense.date}</div>
                </div>
                <div className="text-red-600 font-medium">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No expenses found</div>
        )}
      </CardContent>
    </Card>
  );
} 