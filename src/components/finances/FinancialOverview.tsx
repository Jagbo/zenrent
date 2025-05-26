"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { FinancialData } from "@/types/finances";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { PropertySelector } from "@/components/finances/PropertySelector";

export function FinancialOverview() {
  const { propertyId } = useSelectedProperty();

  const { data, isLoading } = useQuery<FinancialData>({
    queryKey: ["finances", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      // Use a 6-month date range
      const startDate = new Date(new Date().setMonth(new Date().getMonth() - 6))
        .toISOString()
        .split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      console.log("FinancialOverview fetching with params:", {
        propertyId,
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/finances?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`,
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch financial data:",
          response.status,
          response.statusText,
        );
        throw new Error("Failed to fetch financial data");
      }

      const result = await response.json();
      console.log("FinancialOverview received data:", {
        income: result.income?.length || 0,
        expenses: result.expenses?.length || 0,
        firstIncomeItem: result.income?.[0] || null,
      });

      // Return actual data from database - no fallback sample data
      return result;
    },
    enabled: !!propertyId,
  });

  if (!propertyId) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground">
          Select a property to view financial data
        </p>
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
              <CardTitle className="text-sm md:text-base">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader className="p-4">
              <CardTitle className="text-sm md:text-base">
                Total Expenses
              </CardTitle>
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

  const totalIncome =
    data?.income?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalExpenses =
    data?.expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const netProfit = totalIncome - totalExpenses;

  // Check if we have any financial data
  const hasFinancialData = data && (
    (data.income && data.income.length > 0) || 
    (data.expenses && data.expenses.length > 0)
  );

  return (
    <>
      <div className="mb-4">
        <PropertySelector />
      </div>
      
      {!hasFinancialData ? (
        // Empty state when no financial data is available
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No Financial Data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start tracking your property's income and expenses to see financial insights here.
          </p>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Add Income/Expense
            </button>
          </div>
        </div>
      ) : (
        // Show financial data when available
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
              <CardTitle className="text-sm md:text-base">
                Total Expenses
              </CardTitle>
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
              <div className={`text-lg md:text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
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
                {data?.metrics?.roi ? `${data.metrics.roi.toFixed(1)}%` : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
