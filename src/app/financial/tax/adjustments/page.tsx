"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "complete" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "complete" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "current" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

// Types for tax adjustments
type TaxAdjustments = {
  user_id: string;
  tax_year: string;
  use_mileage_allowance: boolean;
  mileage_total: number | null;
  use_property_income_allowance: boolean;
  prior_year_losses: number | null;
  created_at?: string;
  updated_at?: string;
};

export default function AdjustmentsForm() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [useMileage, setUseMileage] = useState(false);
  const [mileageTotal, setMileageTotal] = useState<string>("");
  const [usePropertyAllowance, setUsePropertyAllowance] = useState(false);
  const [priorYearLosses, setPriorYearLosses] = useState<string>("");
  
  // Financial data for calculations 
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  
  // Load existing data
  useEffect(() => {
    async function loadData() {
      try {
        const user = await getAuthUser();
        
        if (user) {
          setUserId(user.id);
          
          // Get tax year
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year")
            .eq("user_id", user.id)
            .single();
            
          if (taxError && taxError.code !== "PGRST116") {
            console.error("Error fetching tax profile:", taxError);
          }
          
          let taxYear = "";
          if (taxProfile?.tax_year) {
            taxYear = taxProfile.tax_year;
          } else {
            // Default to current tax year if not set
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth();
            const day = now.getDate();
            
            // If before April 6th, use previous tax year
            const taxYearStart = month < 3 || (month === 3 && day < 6)
              ? currentYear - 1
              : currentYear;
              
            taxYear = `${taxYearStart}/${taxYearStart + 1}`;
          }
          
          setCurrentTaxYear(taxYear);
          
          // Calculate tax year date range
          const [startYear, endYear] = taxYear.split("/");
          const startDate = `${startYear}-04-06`;
          const endDate = `${endYear}-04-05`;
          
          // Get total expenses for property allowance calculation
          const { data: transactions, error: transError } = await supabase
            .from("bank_transactions")
            .select("amount, category")
            .eq("user_id", user.id)
            .gte("date", startDate)
            .lte("date", endDate);
            
          if (transError) {
            console.error("Error fetching transactions:", transError);
          }
          
          if (transactions) {
            // Calculate total expenses (negative amounts with category != rental_income)
            const expenses = transactions
              .filter(t => t.amount < 0 && t.category !== "exclude")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
              
            setTotalExpenses(expenses);
          }
          
          // Load existing adjustments if any
          const { data: adjustments, error: adjError } = await supabase
            .from("tax_adjustments")
            .select("*")
            .eq("user_id", user.id)
            .eq("tax_year", taxYear)
            .single();
            
          if (adjError && adjError.code !== "PGRST116") {
            console.error("Error fetching adjustments:", adjError);
          }
          
          if (adjustments) {
            setUseMileage(adjustments.use_mileage_allowance || false);
            setMileageTotal(adjustments.mileage_total?.toString() || "");
            setUsePropertyAllowance(adjustments.use_property_income_allowance || false);
            setPriorYearLosses(adjustments.prior_year_losses?.toString() || "");
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
  
  // Calculate mileage allowance
  const calculateMileageAllowance = () => {
    if (!mileageTotal) return 0;
    
    const miles = parseFloat(mileageTotal);
    if (isNaN(miles)) return 0;
    
    // UK mileage allowance: 45p per mile for the first 10,000 miles, 25p thereafter
    if (miles <= 10000) {
      return miles * 0.45;
    } else {
      return (10000 * 0.45) + ((miles - 10000) * 0.25);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !currentTaxYear) {
      setError("User ID or tax year not available");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate inputs
      let mileageTotalNum: number | null = null;
      if (useMileage && mileageTotal) {
        mileageTotalNum = parseFloat(mileageTotal);
        if (isNaN(mileageTotalNum)) {
          throw new Error("Mileage must be a valid number");
        }
      }
      
      let priorYearLossesNum: number | null = null;
      if (priorYearLosses) {
        priorYearLossesNum = parseFloat(priorYearLosses);
        if (isNaN(priorYearLossesNum)) {
          throw new Error("Prior year losses must be a valid number");
        }
      }
      
      // Save adjustments to database
      const adjustments: TaxAdjustments = {
        user_id: userId,
        tax_year: currentTaxYear,
        use_mileage_allowance: useMileage,
        mileage_total: mileageTotalNum,
        use_property_income_allowance: usePropertyAllowance,
        prior_year_losses: priorYearLossesNum,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("tax_adjustments")
        .upsert(adjustments, { 
          onConflict: 'user_id,tax_year',
          ignoreDuplicates: false 
        });
        
      if (error) {
        throw new Error(`Failed to save adjustments: ${error.message}`);
      }
      
      // Navigate to next step
      router.push("/financial/tax/summary");
    } catch (error) {
      console.error("Error saving adjustments:", error);
      setError(error instanceof Error ? error.message : "Failed to save adjustments");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Save as draft handler
  const handleSaveAsDraft = async () => {
    if (!userId || !currentTaxYear) {
      setError("User ID or tax year not available");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert inputs to numbers where needed
      let mileageTotalNum: number | null = null;
      if (useMileage && mileageTotal) {
        mileageTotalNum = parseFloat(mileageTotal);
        if (!isNaN(mileageTotalNum)) {
          mileageTotalNum = null;
        }
      }
      
      let priorYearLossesNum: number | null = null;
      if (priorYearLosses) {
        priorYearLossesNum = parseFloat(priorYearLosses);
        if (isNaN(priorYearLossesNum)) {
          priorYearLossesNum = null;
        }
      }
      
      // Save current state to database
      const adjustments: TaxAdjustments = {
        user_id: userId,
        tax_year: currentTaxYear,
        use_mileage_allowance: useMileage,
        mileage_total: mileageTotalNum,
        use_property_income_allowance: usePropertyAllowance,
        prior_year_losses: priorYearLossesNum,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from("tax_adjustments")
        .upsert(adjustments, { 
          onConflict: 'user_id,tax_year',
          ignoreDuplicates: false 
        });
        
      if (error) {
        throw new Error(`Failed to save draft: ${error.message}`);
      }
      
      // Go to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving draft:", error);
      setError(error instanceof Error ? error.message : "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Additional Details & Adjustments
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Let us know if any additional adjustments apply to you. This information will help us finalize your tax calculation.
            </p>
          </div>

          <form 
            className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
            onSubmit={handleSubmit}
          >
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="px-4 py-4 sm:p-6">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <div className="px-4 py-4 sm:p-6">
                <div className="space-y-6">
                  {/* Mileage Allowance Section */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                      Mileage Allowance
                    </h3>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      If you use your personal vehicle for business purposes related to your rental properties, you can claim a mileage allowance.
                    </p>
                    
                    <div className="mt-4">
                      <div className="flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="use-mileage"
                            name="use-mileage"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            checked={useMileage}
                            onChange={(e) => setUseMileage(e.target.checked)}
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="use-mileage" className="font-medium text-gray-900">
                            Claim mileage allowance for vehicle use
                          </label>
                        </div>
                      </div>
                      
                      {useMileage && (
                        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="mileage-total" className="block text-sm font-medium text-gray-700">
                              Total miles driven for property business:
                            </label>
                            <div className="mt-2">
                              <Input
                                id="mileage-total"
                                type="number"
                                min="0"
                                value={mileageTotal}
                                onChange={(e) => setMileageTotal(e.target.value)}
                                className="block w-full"
                              />
                            </div>
                          </div>
                          
                          {mileageTotal && !isNaN(parseFloat(mileageTotal)) && (
                            <div className="sm:col-span-3 flex items-end">
                              <div className="text-sm text-gray-700 font-medium mt-2 sm:mt-0">
                                Estimated allowed expense: <span className="text-blue-600">£{calculateMileageAllowance().toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="sm:col-span-6">
                            <p className="text-xs text-gray-500">
                              The mileage allowance is 45p per mile for the first 10,000 miles, and 25p per mile thereafter. This covers travel to manage or maintain your rental properties.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Property Income Allowance Section */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                      Property Income Allowance
                    </h3>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      You can claim the £1,000 property income allowance instead of deducting actual expenses if it's more beneficial.
                    </p>
                    
                    <div className="mt-4">
                      <fieldset>
                        <legend className="sr-only">Property Income Allowance options</legend>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="use-property-allowance"
                                name="property-allowance"
                                type="radio"
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                                checked={usePropertyAllowance}
                                onChange={() => setUsePropertyAllowance(true)}
                                disabled={totalExpenses >= 1000}
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor="use-property-allowance" className={`font-medium ${totalExpenses >= 1000 ? 'text-gray-400' : 'text-gray-900'}`}>
                                Claim £1,000 property income allowance
                              </label>
                              {totalExpenses >= 1000 && (
                                <p className="text-xs text-red-600 mt-1">
                                  Not available: Your actual expenses (£{totalExpenses.toFixed(2)}) exceed £1,000.
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="use-actual-expenses"
                                name="property-allowance"
                                type="radio"
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                                checked={!usePropertyAllowance}
                                onChange={() => setUsePropertyAllowance(false)}
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor="use-actual-expenses" className="font-medium text-gray-900">
                                Use actual expenses: £{totalExpenses.toFixed(2)}
                              </label>
                              {totalExpenses < 1000 && (
                                <p className="text-xs text-green-600 mt-1">
                                  Recommended: Using the £1,000 allowance instead would benefit you by £{(1000 - totalExpenses).toFixed(2)}.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </fieldset>
                      
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          The property allowance is a tax-free £1,000 allowance for individuals with property income. You can use this instead of calculating your actual allowable expenses, which may be simpler if you have few expenses.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Prior Year Losses Section */}
                  <div>
                    <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                      Carried Forward Losses
                    </h3>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      If you made a loss on your property business in previous years, you may be able to offset it against this year's profits.
                    </p>
                    
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="prior-year-losses" className="block text-sm font-medium text-gray-700">
                          Loss carried forward from previous year (£)
                        </label>
                        <div className="mt-2">
                          <Input
                            id="prior-year-losses"
                            type="number"
                            min="0"
                            step="0.01"
                            value={priorYearLosses}
                            onChange={(e) => setPriorYearLosses(e.target.value)}
                            className="block w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:col-span-6">
                        <p className="text-xs text-gray-500">
                          Property losses can be carried forward to future tax years and offset against property profits. Leave blank if you have no prior losses to carry forward.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() => router.push("/financial/tax/transactions")}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
              <button type="submit"
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? "Saving..." : "Continue to Summary"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 