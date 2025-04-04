"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SidebarLayout } from "../components/sidebar-layout";
import { Heading } from "../components/heading";
import { Text } from "../components/text";
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
} from "../components/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CodeBracketIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Legend,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarContent } from "../components/sidebar-content";
import { ReportGenerationDrawer } from "../components/ReportGenerationDrawer";

// Icons for navigation items
function DashboardIcon() {
  return <HomeIcon className="w-5 h-5" />;
}

function PropertiesIcon() {
  return <BuildingOfficeIcon className="w-5 h-5" />;
}

function ResidentsIcon() {
  return <UsersIcon className="w-5 h-5" />;
}

function CalendarIconComponent() {
  return <CalendarIcon className="w-5 h-5" />;
}

function IssuesIcon() {
  return <ExclamationCircleIcon className="w-5 h-5" />;
}

function FinancialIcon() {
  return <BanknotesIcon className="w-5 h-5" />;
}

function SuppliersIcon() {
  return <ShoppingBagIcon className="w-5 h-5" />;
}

function IntegrationsIcon() {
  return <CodeBracketIcon className="w-5 h-5" />;
}

// Financial data
const revenueData = [
  { month: "January", income: 120000, expenses: 50000 },
  { month: "February", income: 125000, expenses: 51500 },
  { month: "March", income: 128000, expenses: 54800 },
  { month: "April", income: 130000, expenses: 53400 },
  { month: "May", income: 140000, expenses: 58100 },
  { month: "June", income: 145800, expenses: 61300 },
];

const chartConfig = {
  income: {
    label: "Income",
    color: "#E9823F",
  },
  expenses: {
    label: "Expenses",
    color: "#E95D3F",
  },
};

// Document types for the document table
// const documents = [
//   { id: 1, name: "Mortgage Document.pdf", type: "mortgage", uploadDate: "Jan 15, 2024", property: "Oakwood Heights", fileSize: "2.3 MB" },
//   { id: 2, name: "Home Insurance Policy.pdf", type: "insurance", uploadDate: "Feb 10, 2024", property: "Sunset Apartments", fileSize: "3.1 MB" },
//   { id: 3, name: "Energy Performance Certificate.pdf", type: "epc", uploadDate: "Nov 5, 2023", property: "Parkview Residences", fileSize: "1.5 MB" },
// ]

// Transaction type definition - Updated to match API response
interface Transaction {
  id: string; // Added ID
  date: string;
  type: string;
  category: string;
  description: string;
  property: string;
  amount: number; // Changed to number
  status: string;
}

// Update tabs array with current menu items
const tabs = [
  { name: "Overview", value: "overview", current: true },
  { name: "Expense", value: "expense", current: false },
  { name: "Transactions", value: "transactions", current: false },
  { name: "Properties", value: "properties", current: false },
];

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Add these new types
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
  transactions: Transaction[]; // Added transactions array
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
  // Add properties field for all-properties response
  properties?: {
    property_id: string;
    property_address: string;
    property_code: string;
    income: unknown[];
    expenses: unknown[];
    transactions: Transaction[];
    service_charges: unknown[];
    invoices: unknown[];
    total_income: number;
    total_expenses: number;
    net_profit: number;
    metrics: {
      roi: number;
      yield: number;
      occupancy_rate: number;
    };
    property_performance?: {
      id: string;
      address: string;
      total_units: number;
      monthly_revenue: number;
      monthly_expenses: number;
      noi: number;
      cap_rate: number;
    }[];
  }[];
}

// Add these new types
interface PropertyFromAPI {
  id: string;
  property_code: string;
  address: string;
  type: string;
  total_units: number;
}

interface ApiErrorResponse {
  error: string;
}

type PropertyApiResponse = PropertyFromAPI[] | ApiErrorResponse;

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateString; // Return original string if date is invalid
  }
};

// Update the getCombinedTransactions function to properly handle property addresses
const getCombinedTransactions = (
  financialData: FinancialData | null,
): Transaction[] => {
  if (!financialData) return [];

  // If it's a single property response, transactions are already at the top level
  if (financialData.transactions) {
    return financialData.transactions;
  }

  // If it's an all-properties response, combine transactions from all properties
  if (financialData.properties) {
    console.log(
      "Combining transactions from multiple properties:",
      financialData.properties.length,
    );

    // Collect all transactions from each property
    const allTransactions = financialData.properties.flatMap((property) => {
      console.log(
        `Property ${property.property_id}: ${property.transactions?.length || 0} transactions`,
      );

      return (property.transactions || []).map((transaction: Transaction) => ({
        ...transaction,
        // Make sure property name is included - use property_address from the parent property object
        property:
          transaction.property || property.property_address || "Unknown",
      }));
    });

    // Log the combined transactions for debugging
    console.log("Combined transactions:", allTransactions.length);

    // Sort by date, most recent first
    return allTransactions.sort(
      (a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  return [];
};

// Define a type for property performance records
type PropertyPerformance = {
  id: string;
  address: string;
  total_units: number;
  monthly_revenue: number;
  monthly_expenses: number;
  noi: number;
  cap_rate: number;
};

const getCombinedPropertyPerformance = (
  financialData: FinancialData | null,
): PropertyPerformance[] => {
  if (!financialData) return [];

  // If it's a single property response, property_performance is at the top level
  if (financialData.property_performance) {
    return financialData.property_performance;
  }

  // If it's an all-properties response, collect property_performance from all properties
  if (financialData.properties) {
    return financialData.properties
      .filter(
        (property) =>
          property.property_performance &&
          property.property_performance.length > 0,
      )
      .flatMap((property) => property.property_performance || []);
  }

  return [];
};

// Define explicit types for Income and Expense based on FinancialData interface
interface Income {
  id: string;
  date: string;
  income_type: string;
  category: string;
  description: string;
  amount: number;
}

interface Expense {
  id: string;
  date: string;
  expense_type: string;
  category: string;
  description: string;
  amount: number;
}

// Helper function to get combined income and expenses from FinancialData
const getCombinedIncomeAndExpenses = (
  financialData: FinancialData | null,
): { allIncome: Income[]; allExpenses: Expense[] } => {
  if (!financialData) {
    return { allIncome: [], allExpenses: [] };
  }

  // Single property response
  if (financialData.income && financialData.expenses) {
    // Cast to the explicit types
    return {
      allIncome: (financialData.income as Income[]) || [],
      allExpenses: (financialData.expenses as Expense[]) || [],
    };
  }

  // All properties response
  if (financialData.properties) {
    const allIncome = financialData.properties.flatMap((p) => (p.income as Income[]) || []);
    const allExpenses = financialData.properties.flatMap(
      (p) => (p.expenses as Expense[]) || [],
    );
    return { allIncome, allExpenses };
  }

  return { allIncome: [], allExpenses: [] };
};

// Updated chartConfig specifically for Income Breakdown
const incomeBreakdownChartConfig = {
  rent: {
    label: "Rental Income",
    color: "#E9823F", // Use existing colors or define new ones
  },
  fees: {
    label: "Fees & Deposits",
    color: "#29A3BE",
  },
  other: {
    label: "Other Income",
    color: "#4264CB",
  },
};

export default function Financial() {
  const [isReportDrawerOpen, setIsReportDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyFromAPI[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | "all">(
    "all",
  );
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  // Add ref for clicking outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsPropertyDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define fetchFinancialData with useCallback
  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);

      // Get the current date and date range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      console.log("Fetching financial data for all properties");
      console.log("Using date range:", { startDate, endDate });

      // Build the endpoint URL based on property selection
      let financesEndpoint = `/api/finances?startDate=${startDate}&endDate=${endDate}`;
      if (selectedPropertyId && selectedPropertyId !== "all") {
        financesEndpoint += `&propertyId=${selectedPropertyId}`;
      }
      console.log(
        `[fetchFinancialData] Fetching from endpoint: ${financesEndpoint}`,
      );

      const response = await fetch(financesEndpoint);
      const data = await response.json();

      console.log("[fetchFinancialData] Raw API Response:", data);

      if (!response.ok) {
        console.error("[fetchFinancialData] API Error Response:", data);
        throw new Error(data.error || "Failed to fetch financial data");
      }

      console.log("Financial data fetched:", data);
      setFinancialData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching financial data:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  // First, fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        // Fetch Properties from the main API
        const propertiesResponse = await fetch("/api/properties");
        const propertiesData =
          (await propertiesResponse.json()) as PropertyApiResponse;

        if (!propertiesResponse.ok) {
          const errorMessage =
            propertiesData &&
            typeof propertiesData === "object" &&
            "error" in propertiesData
              ? propertiesData.error
              : `HTTP error! status: ${propertiesResponse.status}`;
          console.error("Properties API HTTP error:", errorMessage);
          throw new Error(errorMessage);
        }

        if (!Array.isArray(propertiesData)) {
          const errorMessage = "Invalid property data format received";
          console.error(errorMessage, propertiesData);
          throw new Error(errorMessage);
        }

        console.log("Properties fetched successfully:", propertiesData);
        setProperties(propertiesData);

        // After setting properties, fetch initial financial data
        await fetchFinancialData();
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Handle property selection
  const handlePropertySelect = (propertyId: string | "all") => {
    console.log(
      "[handlePropertySelect] Property selection changed:",
      propertyId,
    ); // Log selection
    setSelectedPropertyId(propertyId);
    setIsPropertyDropdownOpen(false);
  };

  // Then, update financial data when selectedPropertyId changes
  useEffect(() => {
    console.log(
      "[useEffect - Property Change] Running effect for propertyId:",
      selectedPropertyId,
    );
    if (!properties.length) {
      console.log(
        "[useEffect - Property Change] Skipping fetch because properties list is empty.",
      );
      return;
    }

    if (selectedPropertyId !== "all") {
      // Find the property in the cached data
      const selectedProperty = properties.find(
        (p) => p.id === selectedPropertyId,
      );
      if (!selectedProperty) {
        console.error(
          `[useEffect - Property Change] Selected property ${selectedPropertyId} not found in properties list:`,
          properties,
        );
        return;
      }
    }

    // Fetch financial data with the selected property
    console.log(
      "[useEffect - Property Change] Calling fetchFinancialData for property:",
      selectedPropertyId,
    );
    fetchFinancialData();
  }, [selectedPropertyId, properties]);

  // Process data for Revenue vs Expenses chart
  const revenueExpenseData = useMemo(() => {
    const { allIncome, allExpenses } = getCombinedIncomeAndExpenses(financialData);
    
    if (allIncome.length === 0 && allExpenses.length === 0) return [];

    const monthlyData: { [key: string]: { month: string; income: number; expenses: number } } = {};

    // Helper to get month key (YYYY-MM)
    const getMonthKey = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    // 1. Determine the date range (last 6 months from today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 5);
    startDate.setDate(1); // Start from the beginning of the month

    // Initialize monthlyData for the range
    let currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
        const monthKey = getMonthKey(currentMonth);
        monthlyData[monthKey] = {
            month: currentMonth.toLocaleString('default', { month: 'short' }),
            income: 0,
            expenses: 0,
        };
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // 2. Aggregate income into monthlyData
    allIncome.forEach((inc: Income) => {
      try {
        const incDate = new Date(inc.date);
        const monthKey = getMonthKey(incDate);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].income += inc.amount || 0;
        }
      } catch (e) {
        console.error("Error processing income date:", inc.date, e);
      }
    });

    // 3. Aggregate expenses into monthlyData
    allExpenses.forEach((exp: Expense) => {
      try {
        const expDate = new Date(exp.date);
        const monthKey = getMonthKey(expDate);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].expenses += exp.amount || 0;
        }
      } catch (e) {
        console.error("Error processing expense date:", exp.date, e);
      }
    });

    // 4. Convert monthlyData object to sorted array
    return Object.values(monthlyData);

  }, [financialData]);

  // Process data for Income Breakdown chart
  const incomeBreakdownData = useMemo(() => {
    const { allIncome } = getCombinedIncomeAndExpenses(financialData);
    if (allIncome.length === 0) return [];

    const monthlyIncomeBreakdown: { [key: string]: { month: string; rent: number; fees: number; other: number } } = {};

    // Helper to get month key (YYYY-MM)
    const getMonthKey = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };
    
    // 1. Determine the date range (last 6 months from today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 5);
    startDate.setDate(1); // Start from the beginning of the month

    // Initialize monthlyIncomeBreakdown for the range
    let currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
        const monthKey = getMonthKey(currentMonth);
        monthlyIncomeBreakdown[monthKey] = {
            month: currentMonth.toLocaleString('default', { month: 'short' }),
            rent: 0,
            fees: 0,
            other: 0,
        };
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // 2. Aggregate income into monthlyIncomeBreakdown by category
    allIncome.forEach((inc: Income) => {
      try {
        const incDate = new Date(inc.date);
        const monthKey = getMonthKey(incDate);
        if (monthlyIncomeBreakdown[monthKey]) {
            const category = inc.income_type?.toLowerCase() || 'other';
            const amount = inc.amount || 0;
            if (category.includes('rent')) {
                monthlyIncomeBreakdown[monthKey].rent += amount;
            } else if (category.includes('fee') || category.includes('deposit')) {
                monthlyIncomeBreakdown[monthKey].fees += amount;
            } else {
                monthlyIncomeBreakdown[monthKey].other += amount;
            }
        }
      } catch (e) {
        console.error("Error processing income date for breakdown:", inc.date, e);
      }
    });

    // 3. Convert monthlyIncomeBreakdown object to sorted array
    return Object.values(monthlyIncomeBreakdown);
  }, [financialData]);

  // Process data for Expense Breakdown chart
  const expenseBreakdownData = useMemo(() => {
    const { allExpenses } = getCombinedIncomeAndExpenses(financialData);
    if (allExpenses.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};

    allExpenses.forEach((exp: Expense) => {
      const category = exp.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      fill: `hsl(var(--chart-${Math.abs(category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 5 + 1}))`, // Assign color based on category hash
    }));
  }, [financialData]);

  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    // Update current state in tabs array
    tabs.forEach((tab) => {
      tab.current = tab.value === value;
    });
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  };

  const handleReportSubmit = (reportConfig: unknown) => {
    // Here you would typically generate the report based on the config
    console.log("Generating report with config:", reportConfig);
    setIsReportDrawerOpen(false);
  };

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/financial" />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <Heading level={1}
              className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight"
            >
              Financial Overview
            </Heading>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              <p className="text-sm text-gray-500">
                Track your financial performance across all your properties.
              </p>
            </div>
          </div>
          {/* Property Selector */}
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <div className="w-full md:w-auto relative" ref={dropdownRef}>
              <button type="button"
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() =>
                  setIsPropertyDropdownOpen(!isPropertyDropdownOpen)
                }
              >
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                {selectedPropertyId === "all"
                  ? "All Properties"
                  : properties.find((p) => p.id === selectedPropertyId)
                      ?.address || "Select Property"}
                <ChevronDownIcon className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu */}
              {isPropertyDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button onClick={() => handlePropertySelect("all")}
                      className={`${
                        selectedPropertyId === "all"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700"
                      } block w-full px-4 py-2 text-left text-sm hover:bg-gray-50`}
                    >
                      All Properties
                    </button>
                    {properties.map((property) => (
                      <button key={property.id}
                        onClick={() => handlePropertySelect(property.id)}
                        className={`${
                          selectedPropertyId === property.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700"
                        } block w-full px-4 py-2 text-left text-sm hover:bg-gray-50`}
                      >
                        {property.address}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button"
              onClick={() => setIsReportDrawerOpen(true)}
              className="ml-3 inline-flex items-center rounded-md border border-transparent bg-[#D9E8FF] px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading financial data...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Only show content when data is loaded */}
        {!loading && !error && financialData && (
          <>
            {/* Report Generation Drawer */}
            <ReportGenerationDrawer isOpen={isReportDrawerOpen}
              onClose={() => setIsReportDrawerOpen(false)}
              onSubmit={handleReportSubmit}
            />

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Revenue */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
                  Total Revenue (YTD)
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {financialData?.total_income
                    ? `£${financialData.total_income.toLocaleString()}`
                    : "N/A"}
                </p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>8.2% from last year</span>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
                  Total Expenses (YTD)
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {financialData?.total_expenses
                    ? `£${financialData.total_expenses.toLocaleString()}`
                    : "N/A"}
                </p>
                <div className="mt-4 flex items-center text-sm text-red-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>5.4% from last year</span>
                </div>
              </div>

              {/* Net Operating Income */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
                  Net Operating Income
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {financialData?.net_profit
                    ? `£${financialData.net_profit.toLocaleString()}`
                    : "N/A"}
                </p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>10.3% from last year</span>
                </div>
              </div>

              {/* Cash on Cash Return */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">
                  Cash on Cash Return
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {financialData?.metrics?.roi
                    ? `${financialData.metrics.roi.toFixed(1)}%`
                    : "N/A"}
                </p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>0.6% from last year</span>
                </div>
              </div>
            </div>

            {/* Financial Tabs */}
            <div>
              <div className="grid grid-cols-1 sm:hidden">
                <select value={selectedTab}
                  onChange={(e) => handleTabChange(e.target.value)}
                  aria-label="Select a tab"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#D9E8FF]"
                >
                  {tabs.map((tab) => (
                    <option key={tab.name} value={tab.value}>
                      {tab.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
                />
              </div>
              <div className="hidden sm:block">
                <nav aria-label="Tabs"
                  className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"
                >
                  {tabs.map((tab, tabIdx) => (
                    <button key={tab.name}
                      onClick={() => handleTabChange(tab.value)}
                      aria-current={tab.current ? "page" : undefined}
                      className={classNames(
                        tab.current
                          ? "text-gray-900"
                          : "text-gray-500 hover:text-gray-700",
                        tabIdx === 0 ? "rounded-l-lg" : "",
                        tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                        "group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10",
                      )}
                    >
                      <span>{tab.name}</span>
                      <span aria-hidden="true"
                        className={classNames(
                          tab.current ? "bg-[#FF503E]" : "bg-transparent",
                          "absolute inset-x-0 bottom-0 h-0.5",
                        )}
                      />
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <Tabs value={selectedTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsContent value="overview">
                {/* Revenue vs Expenses Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                    <CardDescription>
                      {revenueExpenseData.length === 0 ? "Calculating date range..." : `From ${revenueExpenseData[0].month} to ${revenueExpenseData[revenueExpenseData.length - 1].month}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <BarChart accessibilityLayer
                        data={revenueExpenseData}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => {
                            try {
                              const [year, monthNum] = value.split("-");
                              const date = new Date(
                                parseInt(year),
                                parseInt(monthNum) - 1,
                                1,
                              );
                              return date.toLocaleString("default", {
                                month: "short",
                              });
                            } catch (e) {
                              return value;
                            }
                          }}
                        />
                        <ChartTooltip cursor={false}
                          content={
                            <ChartTooltipContent
                              indicator="dashed"
                              labelFormatter={(label) => {
                                try {
                                  const [year, monthNum] = label.split("-");
                                  const date = new Date(
                                    parseInt(year),
                                    parseInt(monthNum) - 1,
                                    1,
                                  );
                                  return date.toLocaleString("default", {
                                    month: "short",
                                    year: "numeric",
                                  });
                                } catch (e) {
                                  return label;
                                }
                              }}
                            />
                          }
                        />
                        <Bar dataKey="income" fill="#E9823F" radius={4} />
                        <Bar dataKey="expenses" fill="#E95D3F" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 font-medium leading-none text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>Revenue is trending up by 5.2% this quarter</span>
                    </div>
                    <div className="leading-none text-muted-foreground">
                      Expenses remain stable compared to previous months
                    </div>
                  </CardFooter>
                </Card>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Expense Breakdown by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Breakdown by Category</CardTitle>
                      <CardDescription>January - June 2024</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{
                          maintenance: {
                            label: "Maintenance",
                            color: "#E95D3F",
                          },
                          utilities: {
                            label: "Utilities",
                            color: "#E9823F",
                          },
                          taxes: {
                            label: "Property Taxes",
                            color: "#29A3BE",
                          },
                          insurance: {
                            label: "Insurance",
                            color: "#4264CB",
                          },
                          other: {
                            label: "Other",
                            color: "#F5A623",
                          },
                        }}
                        className="mx-auto aspect-square max-h-[300px]"
                      >
                        <PieChart>
                          <Pie data={expenseBreakdownData}
                            dataKey="value"
                            nameKey="name"
                          />
                          <Legend verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{
                              paddingTop: "20px",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Occupancy Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Occupancy Trend</CardTitle>
                      <CardDescription>January - June 2024</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{
                          occupancy: {
                            label: "Occupancy Rate (%)",
                            color: "#E9823F",
                          },
                        }}
                      >
                        <LineChart accessibilityLayer
                          data={[
                            { month: "January", occupancy: 89 },
                            { month: "February", occupancy: 91 },
                            { month: "March", occupancy: 92 },
                            { month: "April", occupancy: 92 },
                            { month: "May", occupancy: 93 },
                            { month: "June", occupancy: 94 },
                          ]}
                          margin={{
                            top: 20,
                            left: 12,
                            right: 12,
                          }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                          />
                          <ChartTooltip cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <Line dataKey="occupancy"
                            type="natural"
                            stroke="#E9823F"
                            strokeWidth={2}
                            dot={{
                              fill: "#E9823F",
                            }}
                            activeDot={{
                              r: 6,
                            }}
                          >
                            <LabelList position="top"
                              offset={12}
                              className="fill-foreground"
                              fontSize={12}
                            />
                          </Line>
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex gap-2 font-medium leading-none text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Occupancy trending up by 5.2% this month</span>
                      </div>
                      <div className="leading-none text-muted-foreground">
                        Showing occupancy rates for the last 6 months
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Financial Data Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">
                      Property Financial Performance
                    </h3>
                    <p className="text-sm text-gray-500">
                      Revenue and expense breakdown by property.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Property
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Rooms
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Monthly Revenue
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Monthly Expenses
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            NOI
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Cap Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getCombinedPropertyPerformance(financialData).map(
                          (property) => (
                            <tr key={property.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {property.address}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {property.total_units}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                £
                                {property.monthly_revenue.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  },
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                £
                                {property.monthly_expenses.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  },
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                £
                                {property.noi.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    property.cap_rate >= 8
                                      ? "bg-green-100 text-green-800"
                                      : property.cap_rate >= 7
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {property.cap_rate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                        {getCombinedPropertyPerformance(financialData)
                          .length === 0 && (
                          <tr>
                            <td colSpan={6}
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No property performance data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="expense">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>
                      Monthly expenses by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                        maintenance: {
                          label: "Maintenance",
                          color: "#E95D3F",
                        },
                        utilities: {
                          label: "Utilities",
                          color: "#E9823F",
                        },
                        taxes: {
                          label: "Property Taxes",
                          color: "#29A3BE",
                        },
                        insurance: {
                          label: "Insurance",
                          color: "#4264CB",
                        },
                        other: {
                          label: "Other",
                          color: "#F5A623",
                        },
                      }}
                    >
                      <BarChart accessibilityLayer
                        data={expenseBreakdownData}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => {
                            try {
                              const [year, monthNum] = value.split("-");
                              const date = new Date(
                                parseInt(year),
                                parseInt(monthNum) - 1,
                                1,
                              );
                              return date.toLocaleString("default", {
                                month: "short",
                              });
                            } catch (e) {
                              return value;
                            }
                          }}
                        />
                        <ChartTooltip cursor={false}
                          content={
                            <ChartTooltipContent
                              indicator="dashed"
                              labelFormatter={(label) => {
                                try {
                                  const [year, monthNum] = label.split("-");
                                  const date = new Date(
                                    parseInt(year),
                                    parseInt(monthNum) - 1,
                                    1,
                                  );
                                  return date.toLocaleString("default", {
                                    month: "short",
                                    year: "numeric",
                                  });
                                } catch (e) {
                                  return label;
                                }
                              }}
                            />
                          }
                        />
                        <Bar dataKey="value" fill="#E9823F" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 font-medium leading-none text-red-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        Maintenance costs increased by 22% in the last 6 months
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-cabinet-grotesk-bold text-gray-900">
                        Recent Transactions
                      </h3>
                      <p className="text-sm text-gray-500">
                        Recent financial activities across all properties.
                      </p>
                    </div>
                    {/* Search/Filter controls can be added here later */}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Property
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getCombinedTransactions(financialData)
                          .slice(0, 10)
                          .map((transaction) => (
                            <tr key={transaction.id}
                              onClick={() => handleViewTransaction(transaction)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.property}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    transaction.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {getCombinedTransactions(financialData).length === 0 && (
                          <tr>
                            <td colSpan={7}
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No transaction data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200">
                    <Link href="/financial/transactions"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View all transactions
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    console.log("[Properties Tab Render] financialData:", financialData);
                    console.log("[Properties Tab Render] financialData.properties:", financialData?.properties);
                    console.log("[Properties Tab Render] financialData.properties.length:", financialData?.properties?.length);
                    console.log("[Properties Tab Render] loading:", loading);
                    
                    if (financialData && financialData.properties && financialData.properties.length > 0) {
                      return financialData.properties.map((property) => (
                        <Card key={property.property_id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                          <CardHeader>
                            <CardTitle>
                              {property.property_address || "Unknown Address"}
                            </CardTitle>
                            <CardDescription>
                              {property.property_performance &&
                              property.property_performance.length > 0
                                ? `${property.property_performance[0].total_units} Units`
                                : "Units N/A"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">
                                  Monthly Revenue
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  £{property.total_income?.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Expenses</p>
                                <p className="text-lg font-bold text-gray-900">
                                  £
                                  {property.total_expenses?.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">NOI</p>
                                <p className="text-lg font-bold text-gray-900">
                                  £{property.net_profit?.toLocaleString() || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Cap Rate</p>
                                <p className={`text-lg font-bold ${
                                    property.property_performance &&
                                    property.property_performance.length > 0 &&
                                    property.property_performance[0].cap_rate >= 8
                                      ? "text-green-600"
                                      : property.property_performance &&
                                          property.property_performance.length >
                                            0 &&
                                          property.property_performance[0]
                                            .cap_rate >= 7
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {property.property_performance &&
                                  property.property_performance.length > 0
                                    ? `${property.property_performance[0].cap_rate?.toFixed(1)}%`
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t pt-4">
                            <Link href={`/properties/${property.property_id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View property details
                            </Link>
                          </CardFooter>
                        </Card>
                      ));
                    } else {
                      return (
                        <div className="col-span-full text-center text-gray-500 py-8">
                          {loading
                            ? "Loading properties..."
                            : "No property financial data available."}
                        </div>
                      );
                    }
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Transaction Details Drawer - Update to use formatted data */}
      {isDrawerOpen && selectedTransaction && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto py-6">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <h2 className="text-lg font-medium text-gray-900">
                          Transaction Details
                        </h2>
                        <button type="button"
                          className="ml-3 flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500"
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 px-4 sm:px-6">
                      <dl className="divide-y divide-gray-200">
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Date
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {formatDate(selectedTransaction.date)}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Type
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {selectedTransaction.type}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Category
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {selectedTransaction.category}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Description
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {selectedTransaction.description}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Property
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {selectedTransaction.property}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Amount
                          </dt>
                          <dd className={`mt-1 text-sm sm:col-span-2 sm:mt-0 ${selectedTransaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(selectedTransaction.amount)}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">
                            Status
                          </dt>
                          <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedTransaction.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {selectedTransaction.status}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
