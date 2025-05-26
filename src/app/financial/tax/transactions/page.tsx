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
import { toast } from 'sonner';
import { getCurrentTaxYear } from "@/services/tax-calculator";

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

// Transaction type
type Transaction = {
  id: string;
  name: string | null;
  date: string;
  amount: number;
  category: string[] | null;
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

// Helper function to check if a date falls within a custom date range
const isDateInRange = (date: Date, startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
};

// Export transactions to CSV
const exportToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Type', 'Bank', 'Account'];
  
  const csvContent = [
    headers.join(','),
    ...transactions.map(transaction => {
      const categoryString = transaction.category && transaction.category.length > 0 ? transaction.category[0] : '';
      const categoryInfo = categoryString ? categories.find(c => c.value === categoryString) : null;
      const type = categoryInfo?.type || '';
      
      return [
        transaction.date,
        `"${transaction.name || ''}"`,
        transaction.amount,
        `"${categoryInfo?.label || ''}"`,
        type,
        `"${transaction.bank_name || ''}"`,
        `"${transaction.account_number_end || ''}"`,
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function TransactionReview() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  
  // Enhanced filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"tax_year" | "custom">("tax_year");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Bulk operations state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Modal state for adding manual transaction
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    date: "",
    amount: "",
    category: "",
    is_manually_added: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState<string>("");

  // Initialize date filters based on current tax year
  useEffect(() => {
    if (currentTaxYear) {
      const year = parseInt(currentTaxYear);
      setCustomStartDate(`${year}-04-06`);
      setCustomEndDate(`${year + 1}-04-05`);
    }
  }, [currentTaxYear]);

  // Fetch transactions on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const user = await getAuthUser();

        if (user) {
          setUserId(user.id);

          // Fetch user's active tax year AND selected properties
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year, selected_property_ids")
            .eq("user_id", user.id)
            .single();

          let startDate: string | null = null;
          let endDate: string | null = null;
          let resolvedTaxYear: string | null = null;

          if (taxProfile?.tax_year) {
            resolvedTaxYear = taxProfile.tax_year;
            setCurrentTaxYear(taxProfile.tax_year);
            // Calculate date range for the tax year (Apr 6 - Apr 5)
            const [startYear, endYear] = taxProfile.tax_year.split("/");
            startDate = `${startYear}-04-06`;
            endDate = `${endYear}-04-05`;
          } else {
            // Default to current tax year if not set
            resolvedTaxYear = getCurrentTaxYear();
            setCurrentTaxYear(resolvedTaxYear);
            const year = parseInt(resolvedTaxYear);
            startDate = `${year}-04-06`;
            endDate = `${year + 1}-04-05`;
          }

          if (startDate && endDate) {
            const selectedPropertyIds = taxProfile?.selected_property_ids;

            if (!selectedPropertyIds || selectedPropertyIds.length === 0) {
              setTransactions([]);
              setLoading(false);
              return;
            }

            // Fetch transactions for the tax year, filtered by selected properties
            const { data, error: dbError } = await supabase
              .from("bank_transactions")
              .select("*")
              .in("property_id", selectedPropertyIds)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: false });

            if (dbError) {
              throw new Error(`Error fetching transactions: ${dbError.message}`);
            }

            if (data) {
              setTransactions(data as Transaction[]);
            } else {
              setTransactions([]);
            }
          } else {
            setTransactions([]);
          }
        } else {
          setError("User not authenticated.");
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
        setError(error instanceof Error ? error.message : "Failed to load transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Bulk select/deselect functions
  const toggleTransactionSelection = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredTransactions.map(t => t.id));
    setSelectedTransactions(visibleIds);
    setShowBulkActions(visibleIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
    setShowBulkActions(false);
  };

  // Bulk categorization
  const applyBulkCategory = async () => {
    if (!bulkCategory || selectedTransactions.size === 0) {
      toast.error("Please select a category and transactions");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatePromises = Array.from(selectedTransactions).map(transactionId =>
        updateCategoryInDb(transactionId, bulkCategory)
      );

      await Promise.all(updatePromises);
      
      toast.success(`Updated ${selectedTransactions.size} transactions`);
      clearSelection();
      setBulkCategory("");
    } catch (error) {
      console.error("Error applying bulk category:", error);
      toast.error("Failed to update some transactions");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update transaction category (local only version for when AI updates)
  const updateLocalCategory = (transactionId: string, category: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, category: category ? [category] : [] }
          : transaction
      )
    );
  };

  // Update transaction category in DB (for manual dropdown changes)
  const updateCategoryInDb = async (transactionId: string, category: string) => {
    try {
      // Update local state first for immediate UI feedback
      updateLocalCategory(transactionId, category);
      
      // Convert to array for storage
      const categoryArray = category ? [category] : [];
      
      // Update in database
      const { error } = await supabase
        .from("bank_transactions")
        .update({ category: categoryArray })
        .eq("id", transactionId);
      
      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to update transaction");
      throw error; // Re-throw for bulk operations
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
          category: [newTransaction.category],
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
        toast.success("Transaction added successfully");
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
      toast.success("Transaction deleted");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };
  
  // Save categorizations to database
  const saveCategorizationsToDb = async () => {
    if (transactions.length === 0) {
      toast.info("No transactions to save.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare payload with all transactions to update categories
      const updatePayload = transactions.map(tx => ({
        id: tx.id,
        category: Array.isArray(tx.category) && tx.category.length > 0 
          ? tx.category[0] 
          : tx.category || "exclude"
      }));
      
      // Send to API endpoint to update in bulk
      const dbRes = await fetch('/api/financial/tax/update-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      
      const responseData = await dbRes.json();
      
      if (!dbRes.ok) {
        throw new Error(`Some categories failed to update in the database: ${responseData.error || dbRes.status}`);
      }
      
      toast.success("All transaction categories saved successfully!");
      return responseData;
    } catch (error) {
      console.error("Error saving transaction categories:", error);
      setError(error instanceof Error ? error.message : "Failed to save transaction categories");
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while saving.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-categorize transactions
  const handleAutoCategorize = async () => {
    if (transactions.length === 0) {
      toast.info("No transactions to categorize.");
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

      const response = await fetch('/api/openai/categorize-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
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
      
      setCategorizationProgress("Categorization complete! Please review and save your changes.");
      toast.success("Transactions successfully auto-categorized! Click 'Save' to commit changes to database.");
      
    } catch (error) {
      console.error("Error auto-categorizing transactions:", error);
      setError(error instanceof Error ? error.message : "Failed to auto-categorize transactions");
      toast.error(error instanceof Error ? `Categorization failed: ${error.message}` : "An unknown error occurred during categorization.");
    } finally {
      setIsCategorizing(false);
      setTimeout(() => setCategorizationProgress(""), 3000);
    }
  };

  // Enhanced filtering with search, date range, and category
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = transaction.name?.toLowerCase().includes(searchLower);
        const matchesAmount = transaction.amount.toString().includes(searchTerm);
        const categoryString = transaction.category && transaction.category.length > 0 ? transaction.category[0] : null;
        const categoryInfo = categoryString ? categories.find(c => c.value === categoryString) : null;
        const matchesCategory = categoryInfo?.label.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesAmount && !matchesCategory) {
          return false;
        }
      }

      // Date filter
      if (transaction.date) {
        const transactionDate = new Date(transaction.date);
        
        if (dateFilter === "tax_year" && currentTaxYear) {
          if (!isDateInTaxYear(transactionDate, currentTaxYear)) {
            return false;
          }
        } else if (dateFilter === "custom" && customStartDate && customEndDate) {
          if (!isDateInRange(transactionDate, customStartDate, customEndDate)) {
            return false;
          }
        }
      }

      // Category filter
      if (selectedCategory && selectedCategory !== "all") {
        const categoryString = transaction.category && transaction.category.length > 0 ? transaction.category[0] : null;
        if (categoryString !== selectedCategory) {
          return false;
        }
      }

      // Type filter (income/expense)
      if (filter && filter !== "all") {
        const categoryString = transaction.category && transaction.category.length > 0 ? transaction.category[0] : null;
        const categoryInfo = categoryString ? categories.find(c => c.value === categoryString) : null;
        
        if (filter === "income") {
          return categoryInfo?.type === "income";
        }
        
        if (filter === "expense") {
          return categoryInfo?.type === "expense";
        }
      }

      return true;
    });
  }, [transactions, currentTaxYear, filter, searchTerm, dateFilter, customStartDate, customEndDate, selectedCategory]);
  
  // Calculate summary totals
  const summary = useMemo(() => {
    return categories.reduce((acc, category) => {
      const total = transactions
        .filter(t => t.category && t.category.length > 0 && t.category[0] === category.value)
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (total !== 0) {
        acc[category.value] = {
          label: category.label,
          total: Math.abs(total),
          type: category.type
        };
      }
      
      return acc;
    }, {} as Record<string, { label: string; total: number; type: string }>);
  }, [transactions]);
  
  // Calculate grand totals
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => {
        const categoryString = t.category && t.category.length > 0 ? t.category[0] : null;
        const categoryInfo = categoryString ? categories.find(c => c.value === categoryString) : null;
        return categoryInfo?.type === "income";
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        const categoryString = t.category && t.category.length > 0 ? t.category[0] : null;
        const categoryInfo = categoryString ? categories.find(c => c.value === categoryString) : null;
        return categoryInfo?.type === "expense";
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netProfit = useMemo(() => totalIncome + totalExpenses, [totalIncome, totalExpenses]);

  return (
    <SidebarLayout 
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
                    <Button 
                      onClick={categorizationProgress.includes("complete") ? saveCategorizationsToDb : handleAutoCategorize}
                      disabled={(isCategorizing || loading || transactions.length === 0) || (categorizationProgress.includes("complete") && isSubmitting)}
                    >
                      {isCategorizing ? "Categorizing..." : 
                       isSubmitting ? "Saving..." : 
                       categorizationProgress.includes("complete") ? "Save" : "Auto Categorize"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowModal(true)} disabled={isCategorizing || isSubmitting}>
                       Add Manually
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => exportToCSV(filteredTransactions, `transactions_${currentTaxYear}.csv`)}
                      disabled={filteredTransactions.length === 0}
                    >
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Enhanced Filters */}
                <div className="mt-4 space-y-4">
                  {/* Search and basic filters */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select value={dateFilter} onValueChange={(value: "tax_year" | "custom") => setDateFilter(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tax_year">Tax Year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom date range */}
                  {dateFilter === "custom" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Type filters and bulk actions */}
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                          filter === "all" 
                            ? "bg-gray-100 text-gray-900" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        onClick={() => setFilter("all")}
                      >
                        All ({transactions.length})
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

                    {/* Bulk actions */}
                    {showBulkActions && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedTransactions.size} selected
                        </span>
                        <Select value={bulkCategory} onValueChange={setBulkCategory}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Bulk category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={applyBulkCategory} disabled={!bulkCategory || isSubmitting}>
                          Apply
                        </Button>
                        <Button size="sm" variant="outline" onClick={clearSelection}>
                          Clear
                        </Button>
                      </div>
                    )}
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
                        : "No transactions match the current filters."}
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setShowModal(true)}>
                        Add Transaction Manually
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bulk select controls */}
                    {filteredTransactions.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={selectAllVisible}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Select all visible ({filteredTransactions.length})
                          </button>
                          {selectedTransactions.size > 0 && (
                            <button
                              onClick={clearSelection}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Clear selection
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <table className="min-w-full table-fixed divide-y divide-gray-300">
                      <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '13%' }} />
                      </colgroup>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                              onChange={selectedTransactions.size === filteredTransactions.length ? clearSelection : selectAllVisible}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
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
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedTransactions.has(transaction.id)}
                                onChange={() => toggleTransactionSelection(transaction.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-900">
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
                                value={Array.isArray(transaction.category) && transaction.category.length > 0 ? transaction.category[0] : ""}
                                onValueChange={(value: string) => {
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
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-x-6">
              <Button 
                variant="outline"
                onClick={() => router.push("/financial/tax/properties")}
                disabled={isSubmitting || isCategorizing}
              >
                Back
              </Button>
              <div className="flex gap-x-3">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await saveCategorizationsToDb();
                      router.push("/dashboard");
                    } catch (error) {
                      // Error already handled inside saveCategorizationsToDb
                    }
                  }}
                  disabled={isCategorizing || isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await saveCategorizationsToDb();
                      router.push("/financial/tax/adjustments");
                    } catch (error) {
                      toast.error("Please fix categorization issues before continuing");
                    }
                  }}
                  disabled={loading || isCategorizing || isSubmitting || transactions.length === 0}
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Adjustments'}
                </Button>
              </div>
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
                {filteredTransactions.length !== transactions.length && (
                  <p className="mt-1 text-xs text-blue-600">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                )}
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
                      <span className="font-semibold text-red-600">£{Math.abs(totalExpenses).toFixed(2)}</span>
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
                        netProfit > 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        £{netProfit.toFixed(2)}
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
                        </div>

                        <div>
                          <label htmlFor="transaction-category" className="block text-sm font-medium text-gray-700">
                            Category *
                          </label>
                          <div className="mt-1">
                            <Select
                              value={newTransaction.category}
                              onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                            >
                              <SelectTrigger className="w-full">
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
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:ml-3 sm:w-auto"
                  >
                    {isSubmitting ? "Adding..." : "Add Transaction"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
} 