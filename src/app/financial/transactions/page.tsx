"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";
import {
  XMarkIcon,
  ArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@/components/link";

// Transaction type definition
interface Transaction {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  property: string;
  amount: number;
  status: string;
  receipt_url?: string;
}

// Add type for property
interface Property {
  id: string;
  name: string;
}

// Add type for counts
interface PropertyCounts {
  [key: string]: number;
}

// Add the FinancialData interface like in the main financial page
interface FinancialData {
  expenses: unknown[];
  income: unknown[];
  transactions: Transaction[];
  total_income: number;
  total_expenses: number;
  net_profit: number;
  // Add properties field for all-properties response
  properties?: {
    property_id: string;
    property_address: string;
    property_code: string;
    transactions: Transaction[];
  }[];
}

// Helper function to get combined transactions from all properties
const getCombinedTransactions = (data: FinancialData | null): Transaction[] => {
  if (!data) return [];

  // If it's a single property response, transactions are already at the top level
  if (data.transactions) {
    return data.transactions;
  }

  // If it's an all-properties response, combine transactions from all properties
  if (data.properties) {
    console.log(
      `[TRANSACTIONS] Combining transactions from ${data.properties.length} properties`,
    );

    // Collect all transactions from each property
    const allTransactions = data.properties.flatMap((property) => {
      console.log(
        `[TRANSACTIONS] Property ${property.property_id}: ${property.transactions?.length || 0} transactions`,
      );

      return (property.transactions || []).map((transaction: Transaction) => ({
        ...transaction,
        // Make sure property name is included
        property:
          transaction.property || property.property_address || "Unknown",
      }));
    });

    console.log(
      `[TRANSACTIONS] Combined transactions: ${allTransactions.length}`,
    );

    // Sort by date, most recent first
    return allTransactions.sort(
      (a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  return [];
};

// Get unique values for filters from real data - rename to avoid conflict with properties state variable
const getTypes = (transactions: Transaction[]) => [
  "All",
  ...new Set(transactions.map((t) => t.type)),
];
const getCategories = (transactions: Transaction[]) => [
  "All",
  ...new Set(transactions.map((t) => t.category)),
];
const getPropertyNames = (transactions: Transaction[]) => [
  "All",
  ...new Set(transactions.map((t) => t.property)),
];
const getStatuses = (transactions: Transaction[]) => [
  "All",
  ...new Set(transactions.map((t) => t.status)),
];

export default function Transactions(): ReactElement {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | "all">(
    "all",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // First fetch properties
        const propertiesResponse = await fetch("/api/properties");
        const propertiesData = await propertiesResponse.json();

        if (!propertiesResponse.ok) {
          throw new Error("Failed to fetch properties");
        }

        if (!Array.isArray(propertiesData) || propertiesData.length === 0) {
          throw new Error("No properties found for this user");
        }

        setProperties(propertiesData);

        // Get 6 months of data
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          .toISOString()
          .split("T")[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];

        // Fetch financial data from the API - use all properties (omit propertyId)
        const financesEndpoint = `/api/finances?startDate=${startDate}&endDate=${endDate}`;
        console.log(`[TRANSACTIONS] Fetching data from: ${financesEndpoint}`);

        const response = await fetch(financesEndpoint);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch financial data");
        }

        // Get combined transactions using our helper function
        const combinedTransactions = getCombinedTransactions(data);

        if (!combinedTransactions || combinedTransactions.length === 0) {
          throw new Error("No transaction data available");
        }

        console.log(
          `[TRANSACTIONS] Successfully fetched ${combinedTransactions.length} transactions`,
        );
        setTransactions(combinedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Add handler to fetch data for a specific property
  const handlePropertyChange = async (propertyId: string | "all") => {
    try {
      setLoading(true);
      setSelectedPropertyId(propertyId);

      // Get date range
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      // Build URL based on property selection
      let financesEndpoint = `/api/finances?startDate=${startDate}&endDate=${endDate}`;
      if (propertyId !== "all") {
        financesEndpoint += `&propertyId=${propertyId}`;
      }

      console.log(
        `[TRANSACTIONS] Fetching data for property ${propertyId} from: ${financesEndpoint}`,
      );

      const response = await fetch(financesEndpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch financial data");
      }

      // Get combined transactions
      const combinedTransactions = getCombinedTransactions(data);

      if (!combinedTransactions || combinedTransactions.length === 0) {
        throw new Error("No transaction data available");
      }

      console.log(
        `[TRANSACTIONS] Successfully fetched ${combinedTransactions.length} transactions`,
      );
      setTransactions(combinedTransactions);

      // Reset filters when property changes
      setPropertyFilter("All");
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  };

  const handleCategoryChange = async (
    transactionId: string,
    newCategory: string,
  ) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      // Update local state
      setTransactions((prevTransactions) =>
        prevTransactions.map((t) =>
          t.id === transactionId ? { ...t, category: newCategory } : t,
        ),
      );
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
      // You might want to show an error toast here
    }
  };

  // Add receipt upload handler
  const handleReceiptUpload = async (transactionId: string, file: File) => {
    try {
      setUploadingReceipt(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("receipt", file);

      const response = await fetch(
        `/api/transactions/${transactionId}/receipt`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload receipt");
      }

      const data = await response.json();

      // Update local state with new receipt URL
      setTransactions((prevTransactions) =>
        prevTransactions.map((t) =>
          t.id === transactionId ? { ...t, receipt_url: data.receipt_url } : t,
        ),
      );

      if (selectedTransaction?.id === transactionId) {
        setSelectedTransaction((prev) =>
          prev ? { ...prev, receipt_url: data.receipt_url } : null,
        );
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload receipt",
      );
    } finally {
      setUploadingReceipt(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Apply search term filter
    if (
      searchTerm &&
      !Object.values(transaction).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    ) {
      return false;
    }

    // Apply type filter
    if (typeFilter !== "All" && transaction.type !== typeFilter) {
      return false;
    }

    // Apply category filter
    if (categoryFilter !== "All" && transaction.category !== categoryFilter) {
      return false;
    }

    // Apply property filter
    if (propertyFilter !== "All" && transaction.property !== propertyFilter) {
      return false;
    }

    // Apply status filter
    if (statusFilter !== "All" && transaction.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Add debug logging to see what's happening with the filters
  console.log(`[TRANSACTIONS] Filter state:`, {
    totalTransactions: transactions.length,
    filteredCount: filteredTransactions.length,
    searchTerm,
    typeFilter,
    categoryFilter,
    propertyFilter,
    statusFilter,
    uniqueProperties: [
      ...new Set(transactions.map((t: Transaction) => t.property)),
    ],
    // Count transactions by property
    propertyCounts: transactions.reduce(
      (counts: PropertyCounts, t: Transaction) => {
        counts[t.property] = (counts[t.property] || 0) + 1;
        return counts;
      },
      {} as PropertyCounts,
    ),
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      signDisplay: "always",
    }).format(amount);
  };

  // Format date
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

  // Computed filter values based on transactions
  const types = getTypes(transactions);
  const categories = getCategories(transactions);
  const propertyNames = getPropertyNames(transactions);
  const statuses = getStatuses(transactions);

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/financial" />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">
              Transactions
            </Heading>
            <Text className="text-gray-500 mt-1">
              View and manage all financial transactions.
            </Text>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/financial"
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Financial Overview
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading transactions
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters - Only show when data is loaded */}
        {!loading && !error && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col space-y-4">
              {/* Property Selector */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="text-sm font-medium text-gray-700">
                  Property:
                </div>
                <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedPropertyId}
                  onChange={(e) =>
                    handlePropertyChange(e.target.value as string | "all")
                  }
                >
                  <option value="all">All Properties</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type} Type
                    </option>
                  ))}
                </select>
                <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category} Category
                    </option>
                  ))}
                </select>
                <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                >
                  <option value="All">All Properties</option>
                  {properties.map((property: Property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <select className="form-select rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status} Status
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {!loading && !error && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
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
                  {filteredTransactions.map((transaction: Transaction) => (
                    <tr key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        {transaction.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(transaction.id);
                        }}
                      >
                        {editingCategory === transaction.id ? (
                          <select className="form-select rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={transaction.category}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCategoryChange(
                                transaction.id,
                                e.target.value,
                              );
                            }}
                            onBlur={() => setEditingCategory(null)}
                            autoFocus
                          >
                            {categories
                              .filter((cat) => cat !== "All")
                              .map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div className="flex items-center justify-between cursor-pointer hover:text-blue-600">
                            <span>{transaction.category}</span>
                            <svg className="h-4 w-4 text-gray-400 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        {transaction.property}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <span className={
                            transaction.amount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewTransaction(transaction)}
                      >
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
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-6">
                <Text className="text-gray-500">
                  No transactions found matching your filters.
                </Text>
              </div>
            )}

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <a href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </a>
                  <a href="#"
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </a>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to{" "}
                      <span className="font-medium">
                        {filteredTransactions.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredTransactions.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <a href="#"
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        &lsaquo;
                      </a>
                      <a href="#"
                        aria-current="page"
                        className="z-10 bg-[#D9E8FF]/5 border-indigo-500 text-gray-900 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                      >
                        1
                      </a>
                      <a href="#"
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        &rsaquo;
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Details Drawer */}
        {isDrawerOpen && selectedTransaction && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-300">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
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
                              {editingCategory === selectedTransaction.id ? (
                                <select className="form-select w-full rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  value={selectedTransaction.category}
                                  onChange={(e) => {
                                    handleCategoryChange(
                                      selectedTransaction.id,
                                      e.target.value,
                                    );
                                  }}
                                  onBlur={() => setEditingCategory(null)}
                                  autoFocus
                                >
                                  {categories
                                    .filter((cat) => cat !== "All")
                                    .map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                </select>
                              ) : (
                                <div className="flex items-center justify-between cursor-pointer hover:text-blue-600"
                                  onClick={() =>
                                    setEditingCategory(selectedTransaction.id)
                                  }
                                >
                                  <span>{selectedTransaction.category}</span>
                                  <svg className="h-4 w-4 text-gray-400 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </div>
                              )}
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
                          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">
                              ID
                            </dt>
                            <dd className="mt-1 text-sm text-gray-500 sm:col-span-2 sm:mt-0">
                              {selectedTransaction.id}
                            </dd>
                          </div>
                          {/* Receipt Upload Section */}
                          <div className="py-4">
                            <dt className="text-sm font-medium text-gray-500 mb-2">
                              Receipt
                            </dt>
                            <dd className="mt-1">
                              {selectedTransaction.receipt_url ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <a href={selectedTransaction.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                    >
                                      <svg className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                      </svg>
                                      <span>View Receipt</span>
                                    </a>
                                    <button type="button"
                                      className="text-sm text-red-600 hover:text-red-800"
                                      onClick={() => {
                                        // Add delete receipt functionality here
                                        console.log("Delete receipt");
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <div className="border rounded-lg p-2 bg-gray-50">
                                    <Image src={selectedTransaction.receipt_url}
                                      alt="Receipt thumbnail"
                                      className="w-full h-32 object-cover rounded"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-center w-full">
                                    <label htmlFor="receipt-upload"
                                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                                        uploadingReceipt
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-4 text-gray-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                          />
                                        </svg>
                                        {uploadingReceipt ? (
                                          <p className="text-sm text-gray-500">
                                            Uploading...
                                          </p>
                                        ) : (
                                          <>
                                            <p className="mb-2 text-sm text-gray-500">
                                              <span className="font-semibold">
                                                Click to upload
                                              </span>{" "}
                                              or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              PNG, JPG or PDF (max. 10MB)
                                            </p>
                                          </>
                                        )}
                                      </div>
                                      <input id="receipt-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".png,.jpg,.jpeg,.pdf"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleReceiptUpload(
                                              selectedTransaction.id,
                                              file,
                                            );
                                          }
                                        }}
                                        disabled={uploadingReceipt}
                                      />
                                    </label>
                                  </div>
                                  {uploadError && (
                                    <p className="mt-2 text-sm text-red-600">
                                      {uploadError}
                                    </p>
                                  )}
                                </div>
                              )}
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
      </div>
    </SidebarLayout>
  );
}
