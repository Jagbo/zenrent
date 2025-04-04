"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { FinancialData } from "@/types/finances";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";

export function IncomeTable() {
  const { propertyId } = useSelectedProperty();

  const { data, isLoading } = useQuery<FinancialData>({
    queryKey: ["finances", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      // Use fixed date range for development to match our test data
      const startDate =
        process.env.NODE_ENV === "development"
          ? "2024-10-01"
          : new Date(new Date().setMonth(new Date().getMonth() - 6))
              .toISOString()
              .split("T")[0];

      const endDate =
        process.env.NODE_ENV === "development"
          ? "2025-03-31"
          : new Date().toISOString().split("T")[0];

      const response = await fetch(
        `/api/finances?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch financial data");
      }
      return response.json();
    },
    enabled: !!propertyId,
  });

  if (!propertyId || !data) {
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.income?.map((income) => (
          <TableRow key={income.id}>
            <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
            <TableCell>{income.income_type}</TableCell>
            <TableCell>{income.category}</TableCell>
            <TableCell>{income.description}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(income.amount)}
            </TableCell>
          </TableRow>
        ))}
        {(!data?.income || data.income.length === 0) && (
          <TableRow>
            <TableCell colSpan={5}
              className="text-center text-muted-foreground"
            >
              No income found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
