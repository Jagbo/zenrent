"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Select } from "../../../components/select";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";

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
  description: string;
  date: string;
  amount: number;
  category: string;
  bank_account_id?: string;
  bank_name?: string;
  account_number_end?: string;
  is_manually_added?: boolean;
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
  
  // Modal state for adding manual transaction
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    date: "",
    amount: "",
    category: "rental_income",
    is_manually_added: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch transactions on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const user = await getAuthUser();
        
        if (user) {
          setUserId(user.id);
          
          // Fetch user's active tax year
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year")
            .eq("user_id", user.id)
            .single();
          
          if (taxError && taxError.code !== "PGRST116") {
            console.error("Error fetching tax profile:", taxError);
          }
          
          if (taxProfile?.tax_year) {
            setCurrentTaxYear(taxProfile.tax_year);
            
            // Calculate date range for the tax year (Apr 6 - Apr 5)
            const [startYear, endYear] = taxProfile.tax_year.split("/");
            const startDate = `${startYear}-04-06`;
            const endDate = `${endYear}-04-05`;
            
            // Fetch transactions for the tax year
            const { data, error } = await supabase
              .from("tax_transactions")
              .select("*")
              .eq("user_id", user.id)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: false });
            
            if (error) {
              throw new Error(`Error fetching transactions: ${error.message}`);
            }
            
            if (data) {
              setTransactions(data as Transaction[]);
            }
          } else {
            // Default to current tax year if not set
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth(); // 0-based (Jan = 0, Apr = 3)
            const day = now.getDate();
            
            // If before April 6th, use previous tax year
            const taxYearStart = month < 3 || (month === 3 && day < 6)
              ? currentYear - 1
              : currentYear;
            
            const taxYear = `${taxYearStart}/${taxYearStart + 1}`;
            setCurrentTaxYear(taxYear);
            
            // Fetch transactions for default tax year
            const startDate = `${taxYearStart}-04-06`;
            const endDate = `${taxYearStart + 1}-04-05`;
            
            const { data, error } = await supabase
              .from("tax_transactions")
              .select("*")
              .eq("user_id", user.id)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: false });
            
            if (error) {
              throw new Error(`Error fetching transactions: ${error.message}`);
            }
            
            if (data) {
              setTransactions(data as Transaction[]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
        setError(error instanceof Error ? error.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Update transaction category
  const updateCategory = async (transactionId: string, category: string) => {
    try {
      // Update local state first for immediate UI feedback
      const updatedTransactions = transactions.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, category } 
          : transaction
      );
      setTransactions(updatedTransactions);
      
      // Update in database
      const { error } = await supabase
        .from("tax_transactions")
        .update({ category })
        .eq("id", transactionId);
      
      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      setError(error instanceof Error ? error.message : "Failed to update transaction");
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
      const category = categories.find(c => c.value === newTransaction.category);
      let finalAmount = amount;
      
      // Ensure income is positive, expense is negative
      if (category?.type === "income" && amount < 0) {
        finalAmount = Math.abs(amount);
      } else if (category?.type === "expense" && amount > 0) {
        finalAmount = -Math.abs(amount);
      }
      
      // Add to database
      const { data, error } = await supabase
        .from("tax_transactions")
        .insert({
          user_id: userId,
          description: newTransaction.description,
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
          category: "rental_income",
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
        .from("tax_transactions")
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
  
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    const category = categories.find(c => c.value === transaction.category);
    return category?.type === filter;
  });
  
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
      const category = categories.find(c => c.value === t.category);
      return category?.type === "income";
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => {
      const category = categories.find(c => c.value === t.category);
      return category?.type === "expense";
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
          <nav aria-label="Progress">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-6 py-4 text-sm font-medium"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">
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
                  <div className="ml-4 mt-4 flex-shrink-0 sm:mt-0">
                    <Button color="indigo" onClick={() => setShowModal(true)}>
                      Add Transaction
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

                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
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
                  <table className="min-w-full divide-y divide-gray-300">
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
                          <td className="px-3 py-4 text-sm text-gray-900 max-w-lg truncate">
                            {transaction.description}
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
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${
                            transaction.amount > 0 
                              ? "text-green-600" 
                              : "text-red-600"
                          }`}>
                            £{Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <Select
                              value={transaction.category || ""}
                              onChange={(e) => updateCategory(transaction.id, e.target.value)}
                              className="block w-full"
                            >
                              <option value="" disabled>Select a category</option>
                              {categories.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
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
                disabled={isSubmitting}
              >
                Back
              </button>
              <button type="button"
                onClick={() => router.push("/dashboard")}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Save as Draft
              </button>
              <button type="button"
                onClick={() => router.push("/financial/tax/adjustments")}
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={loading || transactions.length === 0}
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
                              id="transaction-category"
                              required
                              value={newTransaction.category}
                              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                              className="block w-full"
                            >
                              {categories.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
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
                    disabled={isSubmitting}
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