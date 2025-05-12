"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Button } from "../../../components/button";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "complete" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "complete" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "complete" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "current" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

// Transaction categories
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

// UK Tax Rates (2023/2024 as example)
const taxRates = [
  { band: "Personal Allowance", min: 0, max: 12570, rate: 0 },
  { band: "Basic Rate", min: 12570, max: 50270, rate: 0.2 },
  { band: "Higher Rate", min: 50270, max: 125140, rate: 0.4 },
  { band: "Additional Rate", min: 125140, max: Infinity, rate: 0.45 },
];

// Types for tax calculations
type TaxSummary = {
  // Income
  totalRentalIncome: number;
  incomeByCategory: Record<string, number>;
  
  // Expenses
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  totalMileageAllowance: number | null;
  usePropertyAllowance: boolean;
  propertyAllowanceAmount: number;
  effectiveExpenses: number;
  
  // Profit & Adjustments
  netProfit: number;
  priorYearLosses: number | null;
  adjustedProfit: number;
  
  // Finance Costs
  mortgageInterest: number;
  financeCostTaxReduction: number;
  
  // Tax Calculation
  taxableIncome: number;
  basicRateTax: number;
  higherRateTax: number;
  additionalRateTax: number;
  totalTaxDue: number;
};

export default function TaxSummary() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [showFormPreview, setShowFormPreview] = useState(false);
  
  // Load tax data and calculate summary
  useEffect(() => {
    async function loadData() {
      try {
        const user = await getAuthUser();
        
        if (user) {
          setUserId(user.id);
          
          // Get user profile
          const { data: userProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
          }
          
          // Get tax profile
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
            
          if (taxError) {
            console.error("Error fetching tax profile:", taxError);
          }
          
          if (userProfile && taxProfile) {
            setUserDetails({
              ...userProfile,
              ...taxProfile
            });
            
            setCurrentTaxYear(taxProfile.tax_year || "");
            
            // Get tax year date range
            const [startYear, endYear] = taxProfile.tax_year.split("/");
            const startDate = `${startYear}-04-06`;
            const endDate = `${endYear}-04-05`;
            
            // Load transactions
            const { data: transactions, error: transactionError } = await supabase
              .from("bank_transactions")
              .select("*")
              .eq("user_id", user.id)
              .gte("date", startDate)
              .lte("date", endDate);
              
            if (transactionError) {
              throw new Error(`Error fetching transactions: ${transactionError.message}`);
            }
            
            // Load adjustments
            const { data: adjustments, error: adjustmentsError } = await supabase
              .from("tax_adjustments")
              .select("*")
              .eq("user_id", user.id)
              .eq("tax_year", taxProfile.tax_year)
              .single();
              
            if (adjustmentsError && adjustmentsError.code !== "PGRST116") {
              console.error("Error fetching adjustments:", adjustmentsError);
            }
            
            // Calculate tax summary
            calculateTaxSummary(transactions || [], adjustments || {});
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Calculate tax summary
  const calculateTaxSummary = (transactions: any[], adjustments: any) => {
    // Initialize summary object
    const summary: TaxSummary = {
      totalRentalIncome: 0,
      incomeByCategory: {},
      
      totalExpenses: 0,
      expensesByCategory: {},
      totalMileageAllowance: null,
      usePropertyAllowance: false,
      propertyAllowanceAmount: 0,
      effectiveExpenses: 0,
      
      netProfit: 0,
      priorYearLosses: null,
      adjustedProfit: 0,
      
      mortgageInterest: 0,
      financeCostTaxReduction: 0,
      
      taxableIncome: 0,
      basicRateTax: 0,
      higherRateTax: 0,
      additionalRateTax: 0,
      totalTaxDue: 0,
    };
    
    // Calculate income and expenses by category
    transactions.forEach(transaction => {
      const amount = transaction.amount;
      const category = transaction.category;
      
      // Skip excluded transactions
      if (category === "exclude") return;
      
      // Find category type
      const categoryInfo = categories.find(c => c.value === category);
      
      if (categoryInfo) {
        if (categoryInfo.type === "income") {
          // Add to income
          summary.totalRentalIncome += amount;
          
          // Add to category total
          if (!summary.incomeByCategory[category]) {
            summary.incomeByCategory[category] = 0;
          }
          summary.incomeByCategory[category] += amount;
        } else if (categoryInfo.type === "expense") {
          const absAmount = Math.abs(amount);
          
          // Add to expenses
          summary.totalExpenses += absAmount;
          
          // Add to category total
          if (!summary.expensesByCategory[category]) {
            summary.expensesByCategory[category] = 0;
          }
          summary.expensesByCategory[category] += absAmount;
          
          // Track mortgage interest separately for tax relief
          if (category === "mortgage_interest") {
            summary.mortgageInterest += absAmount;
          }
        }
      }
    });
    
    // Apply adjustments
    if (adjustments) {
      // Mileage allowance
      if (adjustments.use_mileage_allowance && adjustments.mileage_total) {
        const miles = adjustments.mileage_total;
        let mileageAllowance = 0;
        
        // 45p per mile for first 10,000 miles, 25p thereafter
        if (miles <= 10000) {
          mileageAllowance = miles * 0.45;
        } else {
          mileageAllowance = (10000 * 0.45) + ((miles - 10000) * 0.25);
        }
        
        summary.totalMileageAllowance = mileageAllowance;
        summary.totalExpenses += mileageAllowance;
        
        // Add to travel category
        if (!summary.expensesByCategory["travel"]) {
          summary.expensesByCategory["travel"] = 0;
        }
        summary.expensesByCategory["travel"] += mileageAllowance;
      }
      
      // Property income allowance
      summary.usePropertyAllowance = adjustments.use_property_income_allowance || false;
      
      if (summary.usePropertyAllowance) {
        // Apply £1,000 property allowance instead of actual expenses
        summary.propertyAllowanceAmount = 1000;
        summary.effectiveExpenses = 1000;
      } else {
        summary.effectiveExpenses = summary.totalExpenses;
      }
      
      // Prior year losses
      if (adjustments.prior_year_losses) {
        summary.priorYearLosses = adjustments.prior_year_losses;
      }
    } else {
      // No adjustments - use actual expenses
      summary.effectiveExpenses = summary.totalExpenses;
    }
    
    // Calculate net profit (before loss relief)
    summary.netProfit = summary.totalRentalIncome - summary.effectiveExpenses;
    
    // Apply loss relief
    let adjustedProfit = summary.netProfit;
    if (summary.netProfit > 0 && summary.priorYearLosses) {
      // Can't reduce profit below zero
      const usedLosses = Math.min(summary.netProfit, summary.priorYearLosses);
      adjustedProfit = summary.netProfit - usedLosses;
    }
    
    summary.adjustedProfit = adjustedProfit;
    summary.taxableIncome = adjustedProfit;
    
    // Calculate tax on profit
    const taxDue = calculateIncomeTax(adjustedProfit);
    summary.basicRateTax = taxDue.basicRateTax;
    summary.higherRateTax = taxDue.higherRateTax;
    summary.additionalRateTax = taxDue.additionalRateTax;
    
    // Calculate finance cost tax relief (20% of mortgage interest)
    if (summary.mortgageInterest > 0) {
      // Tax credit: 20% of finance costs
      summary.financeCostTaxReduction = summary.mortgageInterest * 0.2;
      
      // Cannot reduce tax below zero
      summary.financeCostTaxReduction = Math.min(
        summary.financeCostTaxReduction,
        taxDue.basicRateTax + taxDue.higherRateTax + taxDue.additionalRateTax
      );
    }
    
    // Calculate final tax due
    summary.totalTaxDue = (
      taxDue.basicRateTax + 
      taxDue.higherRateTax + 
      taxDue.additionalRateTax - 
      summary.financeCostTaxReduction
    );
    
    // Ensure non-negative tax
    summary.totalTaxDue = Math.max(0, summary.totalTaxDue);
    
    setTaxSummary(summary);
  };
  
  // Helper function to calculate income tax
  const calculateIncomeTax = (income: number) => {
    let basicRateTax = 0;
    let higherRateTax = 0;
    let additionalRateTax = 0;
    
    // Apply personal allowance and tax bands
    const personalAllowance = taxRates[0].max;
    const basicRateMax = taxRates[1].max;
    const higherRateMax = taxRates[2].max;
    
    if (income > personalAllowance) {
      // Basic rate (20%)
      const basicRateAmount = Math.min(income, basicRateMax) - personalAllowance;
      if (basicRateAmount > 0) {
        basicRateTax = basicRateAmount * 0.2;
      }
      
      // Higher rate (40%)
      const higherRateAmount = Math.min(income, higherRateMax) - basicRateMax;
      if (higherRateAmount > 0) {
        higherRateTax = higherRateAmount * 0.4;
      }
      
      // Additional rate (45%)
      const additionalRateAmount = income - higherRateMax;
      if (additionalRateAmount > 0) {
        additionalRateTax = additionalRateAmount * 0.45;
      }
    }
    
    return {
      basicRateTax,
      higherRateTax,
      additionalRateTax
    };
  };
  
  // Handle "Generate Tax Return" button click
  const handleGenerateTaxReturn = () => {
    // For now, just navigate to filing page
    router.push("/financial/tax/filing");
  };
  
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

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
            <div>
              <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
                Your Tax Summary for {currentTaxYear}
              </h2>
              <p className="mt-1 text-sm/6 text-gray-600">
                Here's a breakdown of your rental income, expenses, and tax calculation.
              </p>
            </div>
            {userDetails && (
              <div className="text-right text-sm">
                <p className="font-medium">{userDetails.first_name} {userDetails.last_name}</p>
                <p className="text-gray-500">{userDetails.utr && `UTR: ${userDetails.utr}`}</p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="px-4 py-4 sm:p-6">
              <p className="text-gray-500">Loading tax summary...</p>
            </div>
          ) : taxSummary ? (
            <div className="border-t border-gray-200">
              <dl>
                {/* Rental Income Section */}
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Total Rental Income</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className="font-semibold">£{taxSummary.totalRentalIncome.toFixed(2)}</span>
                    
                    {/* Income breakdown if multiple categories */}
                    {Object.keys(taxSummary.incomeByCategory).length > 0 && (
                      <div className="mt-1">
                        {Object.entries(taxSummary.incomeByCategory).map(([category, amount]) => {
                          const categoryInfo = categories.find(c => c.value === category);
                          return (
                            <div key={category} className="text-xs text-gray-500 mt-0.5">
                              <span>{categoryInfo?.label || category}:</span>
                              <span className="ml-2">£{amount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </dd>
                </div>
                
                {/* Allowable Expenses Section */}
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">
                    {taxSummary.usePropertyAllowance ? 
                      "Property Income Allowance" : 
                      "Allowable Expenses"
                    }
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className="font-semibold">£{taxSummary.effectiveExpenses.toFixed(2)}</span>
                    
                    {taxSummary.usePropertyAllowance ? (
                      <div className="mt-1 text-xs text-gray-500">
                        Using £1,000 Property Income Allowance instead of actual expenses (£{taxSummary.totalExpenses.toFixed(2)})
                      </div>
                    ) : (
                      /* Expense breakdown by category */
                      <div className="mt-1">
                        {Object.entries(taxSummary.expensesByCategory).map(([category, amount]) => {
                          const categoryInfo = categories.find(c => c.value === category);
                          return (
                            <div key={category} className="text-xs text-gray-500 mt-0.5">
                              <span>{categoryInfo?.label || category}:</span>
                              <span className="ml-2">£{amount.toFixed(2)}</span>
                              
                              {/* Add note for mileage allowance */}
                              {category === "travel" && taxSummary.totalMileageAllowance && (
                                <span className="italic ml-1">
                                  (includes mileage allowance: £{taxSummary.totalMileageAllowance.toFixed(2)})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </dd>
                </div>
                
                {/* Finance Costs (Mortgage Interest) */}
                {taxSummary.mortgageInterest > 0 && (
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Mortgage Interest & Finance Costs</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="font-semibold">£{taxSummary.mortgageInterest.toFixed(2)}</span>
                      <div className="mt-1 text-xs text-gray-500">
                        Eligible for 20% tax reduction (£{taxSummary.financeCostTaxReduction.toFixed(2)})
                      </div>
                    </dd>
                  </div>
                )}
                
                {/* Net Profit */}
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Net Profit</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className={`font-semibold ${
                      taxSummary.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      £{taxSummary.netProfit.toFixed(2)}
                    </span>
                    <div className="mt-1 text-xs text-gray-500">
                      Total rental income minus allowable expenses
                    </div>
                  </dd>
                </div>
                
                {/* Prior Year Losses (if applicable) */}
                {taxSummary.priorYearLosses && taxSummary.priorYearLosses > 0 && (
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Loss Relief Applied</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="font-semibold">£{Math.min(taxSummary.priorYearLosses, taxSummary.netProfit > 0 ? taxSummary.netProfit : 0).toFixed(2)}</span>
                      <div className="mt-1 text-xs text-gray-500">
                        Losses carried forward from previous years
                      </div>
                    </dd>
                  </div>
                )}
                
                {/* Adjusted Profit (after loss relief) */}
                {taxSummary.priorYearLosses && taxSummary.priorYearLosses > 0 && taxSummary.netProfit !== taxSummary.adjustedProfit && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Adjusted Profit</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span className="font-semibold text-green-600">
                        £{taxSummary.adjustedProfit.toFixed(2)}
                      </span>
                      <div className="mt-1 text-xs text-gray-500">
                        Net profit after applying loss relief
                      </div>
                    </dd>
                  </div>
                )}
                
                {/* Tax Calculation */}
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Tax Calculation</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <div className="space-y-2">
                      {/* Only show tax bands with amounts in them */}
                      {taxSummary.basicRateTax > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Basic rate (20%):</span>
                          <span className="ml-2 font-medium">£{taxSummary.basicRateTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {taxSummary.higherRateTax > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Higher rate (40%):</span>
                          <span className="ml-2 font-medium">£{taxSummary.higherRateTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {taxSummary.additionalRateTax > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Additional rate (45%):</span>
                          <span className="ml-2 font-medium">£{taxSummary.additionalRateTax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Finance cost tax reduction */}
                      {taxSummary.financeCostTaxReduction > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Less: Finance cost relief (20%):</span>
                          <span className="ml-2 font-medium text-green-600">
                            -£{taxSummary.financeCostTaxReduction.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Divider */}
                      <div className="border-t border-gray-200 pt-2">
                        <span className="font-medium">Total Tax Due:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          £{taxSummary.totalTaxDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </dd>
                </div>
                
                {/* Notes & Additional Information */}
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-500 sm:col-span-2 sm:mt-0">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>This summary is for your UK property income only. You may have other income sources to include in your complete Self Assessment.</li>
                      <li>Tax bands and rates are based on the current tax year.</li>
                      <li>We recommend reviewing your tax calculations with an accountant before final submission.</li>
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="px-4 py-5 sm:p-6">
              <p className="text-center text-gray-500">
                No tax data available. Please complete the previous steps to generate your tax summary.
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end gap-x-4">
            <button type="button"
              onClick={() => router.push("/financial/tax/adjustments")}
              className="text-sm/6 font-semibold text-gray-900"
            >
              Back
            </button>
            
            <button type="button"
              onClick={() => setShowFormPreview(true)}
              className="text-sm/6 font-semibold text-blue-600 hover:text-blue-500"
            >
              Preview Forms
            </button>
            
            <button type="button"
              onClick={handleGenerateTaxReturn}
              className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
              disabled={loading || !taxSummary}
            >
              Continue to Filing
            </button>
          </div>
        </div>
      </div>
      
      {/* Form Preview Modal */}
      {showFormPreview && taxSummary && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowFormPreview(false)}
            ></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Self Assessment Forms Preview
                    </h3>
                    
                    <div className="mt-4 border rounded-md overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 font-medium text-sm">
                        SA105 - UK Property Income
                      </div>
                      
                      <div className="p-4">
                        <div className="space-y-3 text-sm">
                          {/* Simplified SA105 mock-up */}
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Your name</span>
                            <span>{userDetails?.first_name} {userDetails?.last_name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Your UTR</span>
                            <span>{userDetails?.utr || 'Not provided'}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Tax year</span>
                            <span>{currentTaxYear}</span>
                          </div>
                          
                          <div className="font-medium pt-2">Income</div>
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Box 1: Total rents and other income from property</span>
                            <span>£{taxSummary.totalRentalIncome.toFixed(2)}</span>
                          </div>
                          
                          <div className="font-medium pt-2">Expenses</div>
                          
                          {Object.entries(taxSummary.expensesByCategory)
                            .filter(([category]) => category !== "mortgage_interest")
                            .map(([category, amount]) => {
                              const categoryInfo = categories.find(c => c.value === category);
                              let boxNumber;
                              switch(category) {
                                case "repairs_maintenance": boxNumber = "3"; break;
                                case "insurance": boxNumber = "4"; break;
                                case "travel": boxNumber = "9"; break;
                                case "agent_fees": boxNumber = "8"; break;
                                default: boxNumber = "12";
                              }
                              
                              return (
                                <div key={category} className="grid grid-cols-2 gap-4 border-b pb-2">
                                  <span className="text-gray-500">
                                    Box {boxNumber}: {categoryInfo?.label || category}
                                  </span>
                                  <span>£{amount.toFixed(2)}</span>
                                </div>
                              );
                            })
                          }
                          
                          {taxSummary.usePropertyAllowance && (
                            <div className="grid grid-cols-2 gap-4 border-b pb-2">
                              <span className="text-gray-500">Box 5.1: Property Income Allowance</span>
                              <span>£{taxSummary.propertyAllowanceAmount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Box 13: Total expenses</span>
                            <span>£{taxSummary.effectiveExpenses.toFixed(2)}</span>
                          </div>
                          
                          <div className="font-medium pt-2">Tax adjustments</div>
                          
                          {taxSummary.mortgageInterest > 0 && (
                            <div className="grid grid-cols-2 gap-4 border-b pb-2">
                              <span className="text-gray-500">Box 15: Finance costs</span>
                              <span>£{taxSummary.mortgageInterest.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="font-medium pt-2">Profit</div>
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Box 21: Profit from UK property</span>
                            <span>£{Math.max(0, taxSummary.netProfit).toFixed(2)}</span>
                          </div>
                          
                          {taxSummary.netProfit < 0 && (
                            <div className="grid grid-cols-2 gap-4 border-b pb-2">
                              <span className="text-gray-500">Box 22: Loss from UK property</span>
                              <span>£{Math.abs(taxSummary.netProfit).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {taxSummary.priorYearLosses && taxSummary.priorYearLosses > 0 && (
                            <div className="grid grid-cols-2 gap-4 border-b pb-2">
                              <span className="text-gray-500">Box 37: Loss brought forward used against this year's profits</span>
                              <span>£{Math.min(taxSummary.priorYearLosses, taxSummary.netProfit > 0 ? taxSummary.netProfit : 0).toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <span className="text-gray-500">Box 41: Taxable profit</span>
                            <span>£{Math.max(0, taxSummary.adjustedProfit).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-500">
                      This is a simplified preview. The actual forms will follow HMRC's official format.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowFormPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
} 