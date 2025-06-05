"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";
import {
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@/components/link";
import Image from "next/image";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Fetch financial data from the API without limiting to 6 months
      // Remove the startDate/endDate parameters to fetch ALL transactions
      const financesEndpoint = `/api/finances`;
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

  useEffect(() => {
    fetchData();
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

  // Auto-categorize transactions
  const handleAutoCategorize = async () => {
    if (transactions.length === 0) {
      alert("No transactions to categorize.");
      return;
    }
    
    setIsCategorizing(true);
    setError(null);
    setCategorizationProgress("Starting categorization process...");

    try {
      if (transactions.length > 100) {
        const batchSize = 50;
        const batchCount = Math.ceil(transactions.length / batchSize);
        setCategorizationProgress(`Processing ${transactions.length} transactions in ${batchCount} batches`);
      } else {
        setCategorizationProgress(`Processing ${transactions.length} transactions`);
      }

      // Transform transactions to match the API format
      const apiTransactions = transactions.map(t => ({
        id: t.id,
        name: t.description,
        date: t.date,
        amount: t.amount,
        category: t.category ? [t.category] : null,
      }));

      const response = await fetch('/api/openai/categorize-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: apiTransactions }),
        signal: AbortSignal.timeout(360000), // 6 minutes timeout
      });

      setCategorizationProgress("Categorization request completed, processing results...");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      setCategorizationProgress("Parsing categorized transactions...");
      const categorizedTransactions = await response.json();

      // Update local state with categorized transactions
      setCategorizationProgress("Updating transaction data...");
      
      // Transform the response back to our format and update transactions
      const updatedTransactions = transactions.map(transaction => {
        const categorized = categorizedTransactions.find((ct: any) => ct.id === transaction.id);
        if (categorized && categorized.category && categorized.category.length > 0) {
          return { ...transaction, category: categorized.category[0] };
        }
        return transaction;
      });
      
      setTransactions(updatedTransactions);
      
      setCategorizationProgress("Categorization complete! Categories have been updated.");
      setTimeout(() => setCategorizationProgress(""), 3000);
      
    } catch (error) {
      console.error("Error auto-categorizing transactions:", error);
      setError(error instanceof Error ? error.message : "Failed to auto-categorize transactions");
    } finally {
      setIsCategorizing(false);
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
    } catch {
      return dateString; // Return original string if date is invalid
    }
  };

  // Computed filter values based on transactions
  const types = getTypes(transactions);
  const categories = getCategories(transactions);
  const statuses = getStatuses(transactions);

  return (
    <SidebarLayout>
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
          <div className="bg-white shadow-sm rounded-xl border border-gray-200/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-50/70 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>{filteredTransactions.length} of {transactions.length} transactions</span>
                  
                  {/* Auto Categorize Button */}
                  <button
                    onClick={handleAutoCategorize}
                    disabled={isCategorizing || transactions.length === 0}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    {isCategorizing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Categorizing...
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Auto Categorize
                      </>
                    )}
                  </button>
                  
                  {(searchTerm || typeFilter !== "All" || categoryFilter !== "All" || propertyFilter !== "All") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setTypeFilter("All");
                        setCategoryFilter("All");
                        setPropertyFilter("All");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress Display */}
              {(isCategorizing || categorizationProgress) && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    {isCategorizing && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <span className="text-sm text-blue-800 font-medium">
                      {categorizationProgress || "Processing transactions..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Filters Content */}
            <div className="p-6 space-y-6">
              {/* Primary Search Bar */}
              <div className="relative">
                <label htmlFor="search-transactions" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Transactions
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="search-transactions"
                    type="text"
                    className="block w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400"
                    placeholder="Search by description, property, amount, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Property Filter */}
                <div className="space-y-2">
                  <label htmlFor="property-select" className="flex items-center text-sm font-medium text-gray-700">
                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Property
                  </label>
                  <select 
                    id="property-select"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertyChange(e.target.value as string | "all")}
                  >
                    <option value="all">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label htmlFor="type-filter" className="flex items-center text-sm font-medium text-gray-700">
                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Type
                  </label>
                  <select 
                    id="type-filter"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type === "All" ? "All Types" : type}
                      </option>
                    ))}
                  </select>
                  {typeFilter !== "All" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                      {typeFilter}
                    </span>
                  )}
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label htmlFor="category-filter" className="flex items-center text-sm font-medium text-gray-700">
                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Category
                  </label>
                  <select 
                    id="category-filter"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === "All" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                  {categoryFilter !== "All" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                      {categoryFilter}
                    </span>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label htmlFor="status-filter" className="flex items-center text-sm font-medium text-gray-700">
                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </label>
                  <select 
                    id="status-filter"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status === "All" ? "All Statuses" : status}
                      </option>
                    ))}
                  </select>
                  {statusFilter !== "All" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                      {statusFilter}
                    </span>
                  )}
                </div>
              </div>

              {/* Active Filters Summary */}
              {(searchTerm || typeFilter !== "All" || categoryFilter !== "All" || propertyFilter !== "All" || statusFilter !== "All") && (
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Active Filters</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Search: "{searchTerm}"
                            <button
                              onClick={() => setSearchTerm("")}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {typeFilter !== "All" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Type: {typeFilter}
                            <button
                              onClick={() => setTypeFilter("All")}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {categoryFilter !== "All" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Category: {categoryFilter}
                            <button
                              onClick={() => setCategoryFilter("All")}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {propertyFilter !== "All" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Property: {propertyFilter}
                            <button
                              onClick={() => setPropertyFilter("All")}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {statusFilter !== "All" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Status: {statusFilter}
                            <button
                              onClick={() => setStatusFilter("All")}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {!loading && !error && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions
                    .slice((currentPage - 1) * 20, currentPage * 20)
                    .map((transaction, index) => (
                      <tr key={transaction.id || index}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${
                          selectedTransaction?.id === transaction.id
                            ? "bg-blue-50"
                            : ""
                        }`}
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
                              value={transaction.category || "exclude"}
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
                              <span>{transaction.category || "Uncategorized"}</span>
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

                      </tr>
                    ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6}
                        className="px-6 py-10 text-center text-sm text-gray-500"
                      >
                        No transactions match your filters.
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              setTypeFilter("All");
                              setCategoryFilter("All");
                              setPropertyFilter("All");
                              setCurrentPage(1);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {transactions.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  {/* Mobile pagination controls */}
                  <button
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => 
                      currentPage < Math.ceil(filteredTransactions.length / 20) && 
                      setCurrentPage(currentPage + 1)
                    }
                    disabled={currentPage >= Math.ceil(filteredTransactions.length / 20)}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage >= Math.ceil(filteredTransactions.length / 20)
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * 20, filteredTransactions.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredTransactions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        &lsaquo;
                      </button>
                      
                      {/* Generate page numbers */}
                      {Array.from({ length: Math.min(5, Math.ceil(filteredTransactions.length / 20)) }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            aria-current={currentPage === pageNum ? "page" : undefined}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-[#D9E8FF]/5 border-indigo-500 text-gray-900"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => 
                          currentPage < Math.ceil(filteredTransactions.length / 20) && 
                          setCurrentPage(currentPage + 1)
                        }
                        disabled={currentPage >= Math.ceil(filteredTransactions.length / 20)}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                          currentPage >= Math.ceil(filteredTransactions.length / 20)
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        &rsaquo;
                      </button>
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
                                  value={selectedTransaction.category || "exclude"}
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
                                  <span>{selectedTransaction.category || "Uncategorized"}</span>
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
                                    <Image 
                                      src={selectedTransaction.receipt_url}
                                      alt="Receipt thumbnail"
                                      width={300}
                                      height={128}
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
