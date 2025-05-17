import { NextResponse } from "next/server";

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

// Financial data interface
interface FinancialData {
  expenses: {
    id: string;
    date: string;
    expense_type: string;
    category: string;
    description: string;
    amount: number;
  }[];
  income: {
    id: string;
    date: string;
    income_type: string;
    category: string;
    description: string;
    amount: number;
  }[];
  transactions: Transaction[];
  service_charges: {
    id: string;
    date: string;
    type: string;
    description: string;
    status: string;
    amount: number;
  }[];
  invoices: {
    id: string;
    date: string;
    invoice_number: string;
    description: string;
    status: string;
    amount: number;
  }[];
  total_income: number;
  total_expenses: number;
  net_profit: number;
  metrics: {
    roi: number;
    yield: number;
    occupancy_rate: number;
  };
  property_performance: {
    id: string;
    address: string;
    total_units: number;
    monthly_revenue: number;
    monthly_expenses: number;
    noi: number;
    cap_rate: number;
  }[];
}

export async function GET(request: Request) {
  try {
    console.log("[DEV-FINANCES] Generating sample financial data");

    // Extract query parameters
    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId");
    const startDate = url.searchParams.get("startDate") || "2024-10-01";
    const endDate = url.searchParams.get("endDate") || "2025-03-31";

    console.log("[DEV-FINANCES] Request parameters:", {
      propertyId,
      startDate,
      endDate,
    });

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    // Sample income data
    const sampleIncome = [
      {
        id: "inc_1",
        date: "2024-10-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
      {
        id: "inc_2",
        date: "2024-11-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
      {
        id: "inc_3",
        date: "2024-12-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
      {
        id: "inc_4",
        date: "2025-01-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
      {
        id: "inc_5",
        date: "2025-02-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
      {
        id: "inc_6",
        date: "2025-03-28",
        income_type: "Rent",
        category: "Monthly Rent",
        description: "Monthly rental income",
        amount: 2000,
      },
    ];

    // Sample expense data
    const sampleExpenses = [
      {
        id: "exp_1",
        date: "2024-10-28",
        expense_type: "Maintenance",
        category: "Repairs",
        description: "Regular maintenance",
        amount: 300,
      },
      {
        id: "exp_2",
        date: "2024-11-28",
        expense_type: "Utilities",
        category: "Electricity",
        description: "Monthly electricity bill",
        amount: 150,
      },
      {
        id: "exp_3",
        date: "2024-12-28",
        expense_type: "Maintenance",
        category: "Repairs",
        description: "Regular maintenance",
        amount: 300,
      },
      {
        id: "exp_4",
        date: "2025-01-28",
        expense_type: "Utilities",
        category: "Electricity",
        description: "Monthly electricity bill",
        amount: 150,
      },
      {
        id: "exp_5",
        date: "2025-02-28",
        expense_type: "Maintenance",
        category: "Repairs",
        description: "Regular maintenance",
        amount: 300,
      },
      {
        id: "exp_6",
        date: "2025-03-28",
        expense_type: "Utilities",
        category: "Electricity",
        description: "Monthly electricity bill",
        amount: 150,
      },
    ];

    const totalIncome = sampleIncome.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalExpenses = sampleExpenses.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Create sample transactions from income/expenses
    const sampleTransactions: Transaction[] = [
      ...sampleIncome.map((inc) => ({
        id: inc.id,
        date: inc.date,
        type: "Income",
        category: inc.category,
        description: inc.description,
        property: "Sample Property", // Generic property for sample data
        amount: inc.amount,
        status: "Completed",
      })),
      ...sampleExpenses.map((exp) => ({
        id: exp.id,
        date: exp.date,
        type: "Expense",
        category: exp.category,
        description: exp.description,
        property: "Sample Property",
        amount: -exp.amount,
        status: "Completed",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate property performance data based on property ID
    const propertyPerformance = [
      {
        id: propertyId,
        address: "Sample Property",
        total_units: 2,
        monthly_revenue: 2000,
        monthly_expenses: 450,
        noi: 1550,
        cap_rate: 7.8,
      },
    ];

    // Create complete financial data
    const financialData: FinancialData = {
      income: sampleIncome,
      expenses: sampleExpenses,
      transactions: sampleTransactions,
      service_charges: [],
      invoices: [],
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: totalIncome - totalExpenses,
      metrics: {
        roi: 15.5,
        yield: 7.2,
        occupancy_rate: 95,
      },
      property_performance: propertyPerformance,
    };

    console.log("[DEV-FINANCES] Returning sample financial data");
    return NextResponse.json(financialData);
  } catch (error) {
    console.error("[DEV-FINANCES] Error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate financial data: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
