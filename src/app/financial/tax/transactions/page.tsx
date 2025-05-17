"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { toast } from 'sonner'; // Import toast for notifications

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "complete" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "current" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

// Transaction categories for tax purposes
const categories = [
  { value: "rental_income", label: "Rental Income", type: "income" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance", type: "expense" },
  { value: "insurance", label: "Insurance", type: "expense" },
  { value: "mortgage_interest", label: "Mortgage Interest", type: "expense" },
  { value: "agent_fees", label: "Agent Fees", type: "expense" },
  { value: "utilities", label: "Utilities", type: "expense" },
  { value: "council_tax", label: "Council Tax", type: "expense" },
  { value: "travel", label: "Travel", type: "expense" },
  { value: "office_admin", label: "Office/Admin", type: "expense" },
  { value: "legal_professional", label: "Legal & Professional", type: "expense" },
  { value: "other_expense", label: "Other Expense", type: "expense" },
  { value: "exclude", label: "Exclude", type: "exclude" },
];

// Helper function to get category options for Select component
const getCategoryOptions = () => {
  return categories.map(category => ({
    value: category.value,
    label: category.label
  }));
};

// Transaction type
type Transaction = {
  id: string;
  name: string | null;
  date: string;
  amount: number;
  category: string | null;
  bank_account_id?: string;
  bank_name?: string;
  account_number_end?: string;
  is_manually_added?: boolean;
};

// Helper function to check if a date falls within a tax year (April 6 to April 5)
const isDateInTaxYear = (date: Date, taxYear: string): boolean => {
  const year = parseInt(taxYear);
  const taxYearStart = new Date(year, 3, 6); // April 6 of the starting year
  const taxYearEnd = new Date(year + 1, 3, 5); // April 5 of the following year
  
  return date >= taxYearStart && date <= taxYearEnd;
};

export default function TransactionReview() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Initial data loading
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  
  // Modal state for adding manual transaction
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    date: "",
    amount: "",
    category: "",
    is_manually_added: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // For manual add modal
  const [isCategorizing, setIsCategorizing] = useState(false); // For auto-categorization loading
  const [categorizationProgress, setCategorizationProgress] = useState<string>(""); // For detailed progress updates
  
  // Fetch transactions on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const user = await getAuthUser();
        console.log('[TaxTransactions] Fetched User:', user);

        if (user) {
          setUserId(user.id);
          console.log('[TaxTransactions] User ID:', user.id);

          // Fetch user's active tax year AND selected properties
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year, selected_property_ids")
            .eq("user_id", user.id)
            .single();
          console.log('[TaxTransactions] Tax Profile fetched:', taxProfile, 'Error:', taxError);

          let startDate: string | null = null;
          let endDate: string | null = null;
          let resolvedTaxYear: string | null = null;

          if (taxProfile?.tax_year) {
            resolvedTaxYear = taxProfile.tax_year;
            setCurrentTaxYear(taxProfile.tax_year);
            console.log('[TaxTransactions] Using tax year from profile:', resolvedTaxYear);
            // Calculate date range for the tax year (Apr 6 - Apr 5)
            const [startYear, endYear] = taxProfile.tax_year.split("/");
            startDate = `${startYear}-04-06`;
            endDate = `${endYear}-04-05`;
          } else {
            console.log('[TaxTransactions] No tax year found in profile, calculating default.');
            // Default to current tax year if not set
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth(); // 0-based (Jan = 0, Apr = 3)
            const day = now.getDate();

            // If before April 6th, use previous tax year
            const taxYearStart = month < 3 || (month === 3 && day < 6)
              ? currentYear - 1
              : currentYear;

            resolvedTaxYear = `${taxYearStart}/${taxYearStart + 1}`;
            setCurrentTaxYear(resolvedTaxYear);
            startDate = `${taxYearStart}-04-06`;
            endDate = `${taxYearStart + 1}-04-05`;
            console.log('[TaxTransactions] Default tax year calculated:', resolvedTaxYear);
          }

          console.log(`[TaxTransactions] Fetching transactions for user ${user.id} between ${startDate} and ${endDate}`);
          
          if (startDate && endDate) {
            const selectedPropertyIds = taxProfile?.selected_property_ids;
            console.log('[TaxTransactions] Filtering by selected property IDs:', selectedPropertyIds);

            if (!selectedPropertyIds || selectedPropertyIds.length === 0) {
              console.log('[TaxTransactions] No properties selected for this tax year. Showing no transactions.');
              setTransactions([]);
              setLoading(false);
              return; // Exit early if no properties selected
            }

            // Fetch transactions for the tax year, filtered by selected properties
            const { data, error: dbError } = await supabase
              .from("bank_transactions")
              .select("*")
              .in("property_id", selectedPropertyIds)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: false });
            
            console.log('[TaxTransactions] Supabase query result:', { data, dbError });

            if (dbError) {
              throw new Error(`Error fetching transactions: ${dbError.message}`);
            }

            if (data) {
              console.log(`[TaxTransactions] Found ${data.length} transactions.`);
              setTransactions(data as Transaction[]);
            } else {
              console.log('[TaxTransactions] No transaction data returned from Supabase.');
              setTransactions([]);
            }
          } else {
            console.error('[TaxTransactions] Could not determine start/end date for query.');
            setTransactions([]);
          }
        } else {
          console.log('[TaxTransactions] No authenticated user found.');
          setError("User not authenticated.");
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
        setError(error instanceof Error ? error.message : "Failed to load transactions");
        setTransactions([]); // Clear transactions on error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  // Update transaction category (local only version for when AI updates)
  const updateLocalCategory = (transactionId: string, category: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, category: category }
          : transaction
      )
    );
  };

  // Update transaction category in DB (for manual dropdown changes)
  const updateCategoryInDb = async (transactionId: string, category: string) => {
    try {
      // Update local state first for immediate UI feedback
      updateLocalCategory(transactionId, category);
      
      // Update in database
      const { error } = await supabase
        .from("bank_transactions")
        .update({ category: category })
        .eq("id", transactionId);
      
      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
      toast.success("Transaction category updated.");
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to update transaction");
      toast.error("Failed to update transaction category.");
      // Revert local state change on error? (Optional, depends on desired UX)
    }
  };
  
  // Add a new manual transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newTransaction.description || !newTransaction.date || !newTransaction.amount || !newTransaction.category) {
      setError("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const amount = parseFloat(newTransaction.amount);
      
      if (isNaN(amount)) {
        throw new Error("Amount must be a valid number");
      }
      
      // Determine if the category is income or expense and adjust amount sign if needed
      const categoryInfo = categories.find(c => c.value === newTransaction.category);
      let finalAmount = amount;
      
      // Ensure income is positive, expense is negative for manual entry
      if (categoryInfo?.type === "income" && amount < 0) {
        finalAmount = Math.abs(amount);
      } else if (categoryInfo?.type === "expense" && amount > 0) {
        finalAmount = -Math.abs(amount);
      }
      
      // Add to database
      const { data, error } = await supabase
        .from("bank_transactions")
        .insert({
          user_id: userId,
          name: newTransaction.description,
          date: newTransaction.date,
          amount: finalAmount,
          category: newTransaction.category,
          is_manually_added: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to add transaction: ${error.message}`);
      }
      
      if (data) {
        // Add to local state
        setTransactions([data as Transaction, ...transactions]);
        
        // Reset form and close modal
        setNewTransaction({
          description: "",
          date: "",
          amount: "",
          category: "",
          is_manually_added: true
        });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    
    try {
      // Remove from database
      const { error } = await supabase
        .from("bank_transactions")
        .delete()
        .eq("id", transactionId);
      
      if (error) {
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }
      
      // Update local state
      setTransactions(transactions.filter(transaction => transaction.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };
  
  // Add new function to save categorized transactions
  const saveCategorizationsToDb = async () => {
    if (transactions.length === 0) {
      toast.info("No transactions to save.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    toast.loading("Saving categorized transactions to database...");

    try {
      // Prepare payload with all transactions to update categories
      const updatePayload = transactions.map(tx => ({ id: tx.id, category: tx.category || "exclude" }));
      
      // Send to API endpoint to update in bulk
      const dbRes = await fetch('/api/financial/tax/update-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      
      if (!dbRes.ok) {
        const err = await dbRes.json();
        throw new Error(`Some categories failed to update in the database: ${err.error || dbRes.status}`);
      }
      
      toast.success("All transaction categories saved to database successfully!");
    } catch (error) {
      console.error("Error saving transaction categories:", error);
      setError(error instanceof Error ? error.message : "Failed to save transaction categories");
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while saving.");
    } finally {
      setIsSubmitting(false);
      toast.dismiss(); // Dismiss loading toast
    }
  };

  // Update handleAutoCategorize to not automatically save to database at the end
  const handleAutoCategorize = async () => {
    if (transactions.length === 0) {
      toast.info("No transactions to categorize.");
      return;
    }
    
    setIsCategorizing(true);
    setError(null);
    setCategorizationProgress("Starting categorization process...");
    toast.loading("Auto-categorizing transactions... This may take a few minutes for large datasets.");

    try {
      // Show batch information if there are many transactions
      if (transactions.length > 100) {
        const batchSize = 50;
        const batchCount = Math.ceil(transactions.length / batchSize);
        setCategorizationProgress(`Processing ${transactions.length} transactions in ${batchCount} batches`);
      } else {
        setCategorizationProgress(`Processing ${transactions.length} transactions`);
      }

      const response = await fetch('/api/openai/categorize-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
        // Increase timeout for the fetch request
        signal: AbortSignal.timeout(360000), // 6 minutes timeout
      });

      setCategorizationProgress("Categorization request completed, processing results...");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      setCategorizationProgress("Parsing categorized transactions...");
      const categorizedTransactions: Transaction[] = await response.json();

      // Update local state with categorized transactions
      setCategorizationProgress("Updating transaction data...");
      setTransactions(categorizedTransactions);
      
      // No longer automatically update categories in the database
      // Instead, notify the user that they need to save the changes
      setCategorizationProgress("Categorization complete! Please review and save your changes.");
      toast.success("Transactions successfully auto-categorized! Click 'Save' to commit changes to database.");
      
    } catch (error) {
      console.error("Error auto-categorizing transactions:", error);
      setError(error instanceof Error ? error.message : "Failed to auto-categorize transactions");
      toast.error(error instanceof Error ? `Categorization failed: ${error.message}` : "An unknown error occurred during categorization.");
    } finally {
      setIsCategorizing(false);
      // Clear progress after a short delay to allow user to see completion message
      setTimeout(() => setCategorizationProgress(""), 3000);
      toast.dismiss(); // Dismiss loading toast
    }
  };

  // Filter transactions based on selected year and category
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Filter by tax year if selected
      if (currentTaxYear && transaction.date) {
        const transactionDate = new Date(transaction.date);
        if (!isDateInTaxYear(transactionDate, currentTaxYear)) {
          return false;
        }
      }

      // Filter by selected category if provided
      if (filter && filter !== "all") {
        const categoryInfo = transaction.category ? categories.find(c => c.value === transaction.category) : null;
        
        // For income filter - only show transactions with income categories
        if (filter === "income") {
          return categoryInfo?.type === "income";
        }
        
        // For expense filter - only show transactions with expense categories
        if (filter === "expense") {
          return categoryInfo?.type === "expense";
        }
      }

      return true;
    });
  }, [transactions, currentTaxYear, filter, categories]);
  
  // Calculate summary totals
  const summary = categories.reduce((acc, category) => {
    // Sum all transactions in this category
    const total = transactions
      .filter(t => t.category === category.value)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Only add non-zero categories to summary
    if (total !== 0) {
      acc[category.value] = {
        label: category.label,
        total: Math.abs(total), // Display as positive
        type: category.type
      };
    }
    
    return acc;
  }, {} as Record<string, { label: string; total: number; type: string }>);
  
  // Calculate grand totals
  const totalIncome = transactions
    .filter(t => {
      const categoryValue = t.category;
      const categoryInfo = categories.find(c => c.value === categoryValue);
      return categoryInfo?.type === "income";
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => {
      const categoryValue = t.category;
      const categoryInfo = categories.find(c => c.value === categoryValue);
      return categoryInfo?.type === "expense";
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return (
    <SidebarLayout 
      sidebar={<SidebarContent currentPath={pathname} />} 
      isOnboarding={false}
      searchValue=""
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress" className="overflow-x-auto">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white min-w-full w-max md:w-full"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium">
                        <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium"
                    >
                      <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-xs md:text-sm text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-900">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-3 py-3 md:px-6 md:py-4 text-sm font-medium">
                        <span className="flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-xs md:text-sm text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true"
                        className="absolute top-0 right-0 hidden h-full w-5 md:block"
                      >
                        <svg fill="none"
                          viewBox="0 0 22 80"
                          preserveAspectRatio="none"
                          className="size-full text-gray-300"
                        >
                          <path d="M0 -2L20 40L0 82"
                            stroke="currentcolor"
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-4">
          {/* Main column */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl">
              {/* Header and filters */}
              <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between sm:flex-nowrap">
                  <div>
                    <h2 className="text-base font-cabinet-grotesk font-bold text-gray-900">
                      Review & Categorize Transactions
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Tax year: {currentTaxYear}
                    </p>
                  </div>
                  <div className="ml-4 mt-4 flex items-center gap-x-2 flex-shrink-0 sm:mt-0">
                    {/* Auto Categorize Button - Changes to Save after categorization */}
                    <Button 
                      color="indigo" 
                      onClick={categorizationProgress.includes("complete") ? saveCategorizationsToDb : handleAutoCategorize}
                      disabled={(isCategorizing || loading || transactions.length === 0) || (categorizationProgress.includes("complete") && isSubmitting)}
                    >
                      {isCategorizing ? "Categorizing..." : 
                       isSubmitting ? "Saving..." : 
                       categorizationProgress.includes("complete") ? "Save" : "Auto Categorize"}
                    </Button>
                    {/* Optional: Add manual transaction button */}
                    <Button variant="outline" onClick={() => setShowModal(true)} disabled={isCategorizing || isSubmitting}>
                       Add Manually
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                      <p className="text-sm text-gray-500">
                        Below are your transactions for the period. Please review and assign an appropriate category to each transaction.
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-none">
                      <div className="flex space-x-2">
                        <button
                          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                            filter === "all" 
                              ? "bg-gray-100 text-gray-900" 
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                          onClick={() => setFilter("all")}
                        >
                          All
                        </button>
                        <button
                          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                            filter === "income" 
                              ? "bg-gray-100 text-gray-900" 
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                          onClick={() => setFilter("income")}
                        >
                          Income
                        </button>
                        <button
                          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                            filter === "expense" 
                              ? "bg-gray-100 text-gray-900" 
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                          onClick={() => setFilter("expense")}
                        >
                          Expenses
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction table */}
              <div className="overflow-x-auto">
                {error && (
                  <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                    <p>{error}</p>
                  </div>
                )}

                {(loading || isCategorizing) && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{loading ? "Loading transactions..." : "Auto-categorizing..."}</p>
                    {isCategorizing && categorizationProgress && (
                      <p className="mt-2 text-sm text-gray-400">{categorizationProgress}</p>
                    )}
                    {isCategorizing && (
                      <div className="mt-4 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    )}
                  </div>
                )}

                {!loading && !isCategorizing && filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-gray-900">No transactions found</h3>
                    <p className="mt-2 text-gray-500">
                      {transactions.length === 0 
                        ? "Your transactions will appear here when imported from your bank or added manually."
                        : "No transactions match the current filter."}
                    </p>
                    <div className="mt-6">
                      <Button color="indigo" onClick={() => setShowModal(true)}>
                        Add Transaction Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full table-fixed divide-y divide-gray-300">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '7%' }} />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Category
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="truncate max-w-[200px] px-3 py-4 text-sm text-gray-900">
                            <div className="truncate">
                              {transaction.name}
                              {transaction.is_manually_added && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Manual
                                </span>
                              )}
                              {transaction.bank_name && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {transaction.bank_name} •••{transaction.account_number_end}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${
                            transaction.amount > 0 
                              ? "text-green-600" 
                              : "text-red-600"
                          }`}>
                            £{Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            <Select
                              value={Array.isArray(transaction.category) ? transaction.category[0] : (transaction.category || "")}
                              onValueChange={(value: string) => {
                                // Use updateCategoryInDb for manual changes
                                updateCategoryInDb(transaction.id, value);
                              }}
                            >
                              <SelectTrigger className="h-8 p-2 text-left">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button 
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-800 ml-4"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button type="button"
                onClick={() => router.push("/financial/tax/properties")}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting || isCategorizing}
              >
                Back
              </button>
              <button type="button"
                onClick={() => {
                  saveCategorizationsToDb();
                  router.push("/dashboard");
                }}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isCategorizing || isSubmitting} // Disable if categorizing or submitting
              >
                Save as Draft
              </button>
              <button type="button"
                onClick={() => {
                  saveCategorizationsToDb();
                  router.push("/financial/tax/adjustments");
                }}
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={loading || isCategorizing || isSubmitting || transactions.length === 0} // Disable if loading, categorizing, or submitting
              >
                Continue to Adjustments
              </button>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl sticky top-20">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Transaction Summary</h3>
                <p className="mt-1 text-sm text-gray-500">
                  For tax year {currentTaxYear}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  {/* Income section */}
                  <div className="py-4 sm:py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Total Income</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                      <span className="font-semibold text-green-600">£{totalIncome.toFixed(2)}</span>
                    </dd>
                    
                    {/* Income categories */}
                    <div className="mt-2 space-y-2">
                      {Object.values(summary)
                        .filter(item => item.type === "income")
                        .map(item => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-gray-500">{item.label}</span>
                            <span className="text-gray-900">£{item.total.toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Expenses section */}
                  <div className="py-4 sm:py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Total Expenses</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                      <span className="font-semibold text-red-600">£{totalExpenses.toFixed(2)}</span>
                    </dd>
                    
                    {/* Expense categories */}
                    <div className="mt-2 space-y-2">
                      {Object.values(summary)
                        .filter(item => item.type === "expense")
                        .map(item => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-gray-500">{item.label}</span>
                            <span className="text-gray-900">£{item.total.toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Net profit section */}
                  <div className="py-4 sm:py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Net Profit</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                      <span className={`font-semibold ${
                        (totalIncome - totalExpenses) > 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        £{(totalIncome - totalExpenses).toFixed(2)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddTransaction}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add Transaction
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="transaction-description" className="block text-sm font-medium text-gray-700">
                            Description *
                          </label>
                          <div className="mt-1">
                            <Input
                              id="transaction-description"
                              required
                              value={newTransaction.description}
                              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                              className="block w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="transaction-date" className="block text-sm font-medium text-gray-700">
                            Date *
                          </label>
                          <div className="mt-1">
                            <Input
                              id="transaction-date"
                              type="date"
                              required
                              value={newTransaction.date}
                              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                              className="block w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="transaction-amount" className="block text-sm font-medium text-gray-700">
                            Amount (£) *
                          </label>
                          <div className="mt-1">
                            <Input
                              id="transaction-amount"
                              type="number"
                              step="0.01"
                              required
                              value={newTransaction.amount}
                              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                              className="block w-full"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Enter a positive number for income, negative for expenses.
                          </p>
                        </div>

                        <div>
                          <label htmlFor="transaction-category" className="block text-sm font-medium text-gray-700">
                            Category *
                          </label>
                          <div className="mt-1">
                            <Select 
                              value={newTransaction.category || ""}
                              onValueChange={(value: string) => setNewTransaction({ ...newTransaction, category: value })}
                            >
                              <SelectTrigger className="h-8 p-2 text-left">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-d9e8ff text-base font-medium text-gray-900 hover:bg-d9e8ff-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-d9e8ff-80 sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Transaction"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting} // Keep disabled only by manual submission
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
} 