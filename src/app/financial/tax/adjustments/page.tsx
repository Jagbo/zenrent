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
  capital_allowances: number | null;
  wear_and_tear_allowance: number | null;
  use_wear_and_tear: boolean;
  created_at?: string;
  updated_at?: string;
};

// Capital allowance types
const capitalAllowanceTypes = [
  { value: "furniture", label: "Furniture & Fittings", rate: 0.18 },
  { value: "equipment", label: "Equipment & Machinery", rate: 0.18 },
  { value: "cars", label: "Cars (low emission)", rate: 0.18 },
  { value: "cars_high", label: "Cars (high emission)", rate: 0.06 },
  { value: "integral", label: "Integral Features", rate: 0.08 },
];

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
  const [mileageType, setMileageType] = useState<"business" | "mixed">("business");
  const [businessPercentage, setBusinessPercentage] = useState<string>("100");
  
  const [usePropertyAllowance, setUsePropertyAllowance] = useState(false);
  const [priorYearLosses, setPriorYearLosses] = useState<string>("");
  
  // Capital allowances state
  const [capitalAllowances, setCapitalAllowances] = useState<Array<{
    type: string;
    description: string;
    cost: string;
    allowance: number;
  }>>([]);
  
  // Wear and tear allowance state
  const [useWearAndTear, setUseWearAndTear] = useState(false);
  const [furnishedRentalIncome, setFurnishedRentalIncome] = useState<string>("");
  
  // Financial data for calculations 
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [totalRentalIncome, setTotalRentalIncome] = useState<number>(0);
  const [furnishedProperties, setFurnishedProperties] = useState<number>(0);
  
  // Load existing data
  useEffect(() => {
    async function loadData() {
      try {
        const user = await getAuthUser();
        
        if (user) {
          setUserId(user.id);
          
          // Get tax year and selected properties
          const { data: taxProfile, error: taxError } = await supabase
            .from("tax_profiles")
            .select("tax_year, selected_property_ids")
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
          
          // Get financial data for calculations
          const selectedPropertyIds = taxProfile?.selected_property_ids || [];
          
          if (selectedPropertyIds.length > 0) {
            // Get transactions for selected properties
            const { data: transactions, error: transError } = await supabase
              .from("bank_transactions")
              .select("amount, category")
              .in("property_id", selectedPropertyIds)
              .gte("date", startDate)
              .lte("date", endDate);
              
            if (transError) {
              console.error("Error fetching transactions:", transError);
            }
            
            if (transactions) {
              // Calculate total expenses and income
              const expenses = transactions
                .filter(t => {
                  const categoryString = Array.isArray(t.category) && t.category.length > 0 ? t.category[0] : null;
                  return t.amount < 0 && categoryString !== "exclude" && categoryString !== "rental_income";
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
              const income = transactions
                .filter(t => {
                  const categoryString = Array.isArray(t.category) && t.category.length > 0 ? t.category[0] : null;
                  return categoryString === "rental_income" || t.amount > 0;
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
                             setTotalExpenses(expenses);
               setTotalRentalIncome(income);
               
               // Get property information for furnished properties count
               const { data: properties, error: propError } = await supabase
                 .from("properties")
                 .select("property_type, metadata")
                 .in("id", selectedPropertyIds);
                 
               if (propError) {
                 console.error("Error fetching properties:", propError);
               }
               
               if (properties) {
                 const furnished = properties.filter(p => 
                   p.property_type === 'furnished_holiday_let' || 
                   (p.metadata && p.metadata.is_furnished)
                 ).length;
                 setFurnishedProperties(furnished);
                 
                 // Set default furnished rental income for wear and tear calculation
                 if (furnished > 0 && income > 0) {
                   setFurnishedRentalIncome((income * 0.8).toString()); // Estimate 80% from furnished properties
                 }
               }
             }
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
            setUseWearAndTear(adjustments.use_wear_and_tear || false);
            
            // Load capital allowances if stored as JSON
            if (adjustments.capital_allowances) {
              try {
                const storedAllowances = typeof adjustments.capital_allowances === 'string' 
                  ? JSON.parse(adjustments.capital_allowances)
                  : adjustments.capital_allowances;
                if (Array.isArray(storedAllowances)) {
                  setCapitalAllowances(storedAllowances);
                }
              } catch (e) {
                console.error("Error parsing capital allowances:", e);
              }
            }
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
  
  // Calculate mileage allowance with enhanced logic
  const calculateMileageAllowance = () => {
    if (!mileageTotal) return 0;
    
    const miles = parseFloat(mileageTotal);
    if (isNaN(miles)) return 0;
    
    // Apply business percentage if mixed use
    const businessMiles = mileageType === "mixed" 
      ? miles * (parseFloat(businessPercentage) / 100)
      : miles;
    
    // UK mileage allowance: 45p per mile for the first 10,000 miles, 25p thereafter
    if (businessMiles <= 10000) {
      return businessMiles * 0.45;
    } else {
      return (10000 * 0.45) + ((businessMiles - 10000) * 0.25);
    }
  };
  
  // Calculate wear and tear allowance (10% of furnished rental income)
  const calculateWearAndTearAllowance = () => {
    if (!useWearAndTear || !furnishedRentalIncome) return 0;
    
    const income = parseFloat(furnishedRentalIncome);
    if (isNaN(income)) return 0;
    
    return income * 0.10; // 10% of furnished rental income
  };
  
  // Calculate total capital allowances
  const calculateTotalCapitalAllowances = () => {
    return capitalAllowances.reduce((total, item) => total + item.allowance, 0);
  };
  
  // Add capital allowance item
  const addCapitalAllowanceItem = () => {
    setCapitalAllowances([
      ...capitalAllowances,
      { type: "furniture", description: "", cost: "", allowance: 0 }
    ]);
  };
  
  // Update capital allowance item
  const updateCapitalAllowanceItem = (index: number, field: string, value: string) => {
    const updated = [...capitalAllowances];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate allowance if cost or type changed
    if (field === "cost" || field === "type") {
      const cost = parseFloat(updated[index].cost);
      const typeInfo = capitalAllowanceTypes.find(t => t.value === updated[index].type);
      if (!isNaN(cost) && typeInfo) {
        updated[index].allowance = cost * typeInfo.rate;
      } else {
        updated[index].allowance = 0;
      }
    }
    
    setCapitalAllowances(updated);
  };
  
  // Remove capital allowance item
  const removeCapitalAllowanceItem = (index: number) => {
    setCapitalAllowances(capitalAllowances.filter((_, i) => i !== index));
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
        capital_allowances: calculateTotalCapitalAllowances(),
        wear_and_tear_allowance: calculateWearAndTearAllowance(),
        use_wear_and_tear: useWearAndTear,
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
        if (isNaN(mileageTotalNum)) {
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
        capital_allowances: calculateTotalCapitalAllowances(),
        wear_and_tear_allowance: calculateWearAndTearAllowance(),
        use_wear_and_tear: useWearAndTear,
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
              Tax Adjustments & Allowances
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Configure additional allowances and adjustments that apply to your rental property business. These can significantly reduce your tax liability.
            </p>
            
            {/* Summary of potential savings */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                Potential Tax Savings
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Mileage Allowance:</span>
                  <span className="font-medium text-blue-900">£{calculateMileageAllowance().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Capital Allowances:</span>
                  <span className="font-medium text-blue-900">£{calculateTotalCapitalAllowances().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Wear & Tear:</span>
                  <span className="font-medium text-blue-900">£{calculateWearAndTearAllowance().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-700 font-medium">Total Additional Allowances:</span>
                  <span className="font-bold text-green-700">
                    £{(calculateMileageAllowance() + calculateTotalCapitalAllowances() + calculateWearAndTearAllowance()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
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
                <div className="space-y-8">
                  {/* Enhanced Mileage Allowance Section */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                      Mileage Allowance
                    </h3>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      Claim for business travel related to your rental properties using the HMRC approved mileage rates.
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
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="mileage-total" className="block text-sm font-medium text-gray-700">
                                Total miles driven:
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
                            
                            <div className="sm:col-span-3">
                              <label htmlFor="mileage-type" className="block text-sm font-medium text-gray-700">
                                Vehicle usage:
                              </label>
                              <div className="mt-2">
                                <Select
                                  id="mileage-type"
                                  value={mileageType}
                                  onChange={(e) => setMileageType(e.target.value as "business" | "mixed")}
                                  className="block w-full"
                                >
                                  <option value="business">Business use only</option>
                                  <option value="mixed">Mixed business/personal use</option>
                                </Select>
                              </div>
                            </div>
                            
                            {mileageType === "mixed" && (
                              <div className="sm:col-span-3">
                                <label htmlFor="business-percentage" className="block text-sm font-medium text-gray-700">
                                  Business use percentage:
                                </label>
                                <div className="mt-2">
                                  <Input
                                    id="business-percentage"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={businessPercentage}
                                    onChange={(e) => setBusinessPercentage(e.target.value)}
                                    className="block w-full"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {mileageTotal && !isNaN(parseFloat(mileageTotal)) && (
                              <div className="sm:col-span-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="text-sm text-green-800">
                                    <strong>Calculated allowance: £{calculateMileageAllowance().toFixed(2)}</strong>
                                    <div className="mt-1 text-xs">
                                      Rate: 45p/mile (first 10,000 miles), 25p/mile thereafter
                                      {mileageType === "mixed" && ` • Business use: ${businessPercentage}%`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Capital Allowances Section */}
                  <div className="border-b border-gray-900/10 pb-6">
                    <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                      Capital Allowances
                    </h3>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      Claim allowances for equipment, furniture, and other capital items used in your rental business.
                    </p>
                    
                    <div className="mt-4 space-y-4">
                      {capitalAllowances.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-12 p-4 border border-gray-200 rounded-lg">
                          <div className="sm:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <Select
                              value={item.type}
                              onChange={(e) => updateCapitalAllowanceItem(index, "type", e.target.value)}
                              className="mt-1 block w-full"
                            >
                              {capitalAllowanceTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          
                          <div className="sm:col-span-4">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <Input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateCapitalAllowanceItem(index, "description", e.target.value)}
                              className="mt-1 block w-full"
                              placeholder="e.g., Office desk and chair"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Cost (£)</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.cost}
                              onChange={(e) => updateCapitalAllowanceItem(index, "cost", e.target.value)}
                              className="mt-1 block w-full"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Allowance</label>
                            <div className="mt-1 text-sm font-medium text-green-600">
                              £{item.allowance.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="sm:col-span-1 flex items-end">
                            <Button
                              type="button"
                              onClick={() => removeCapitalAllowanceItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        onClick={addCapitalAllowanceItem}
                        className="mt-2"
                      >
                        Add Capital Allowance Item
                      </Button>
                      
                      {capitalAllowances.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-800">
                            <strong>Total Capital Allowances: £{calculateTotalCapitalAllowances().toFixed(2)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Wear and Tear Allowance Section */}
                  {furnishedProperties > 0 && (
                    <div className="border-b border-gray-900/10 pb-6">
                      <h3 className="text-base/7 font-cabinet-grotesk font-semibold text-gray-900">
                        Wear and Tear Allowance
                      </h3>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        For furnished rental properties, you can claim 10% of the net rental income as wear and tear allowance.
                      </p>
                      
                      <div className="mt-4">
                        <div className="flex items-start">
                          <div className="flex h-6 items-center">
                            <input
                              id="use-wear-and-tear"
                              name="use-wear-and-tear"
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              checked={useWearAndTear}
                              onChange={(e) => setUseWearAndTear(e.target.checked)}
                            />
                          </div>
                          <div className="ml-3 text-sm leading-6">
                            <label htmlFor="use-wear-and-tear" className="font-medium text-gray-900">
                              Claim wear and tear allowance for furnished properties
                            </label>
                          </div>
                        </div>
                        
                        {useWearAndTear && (
                          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="furnished-rental-income" className="block text-sm font-medium text-gray-700">
                                Net rental income from furnished properties (£):
                              </label>
                              <div className="mt-2">
                                <Input
                                  id="furnished-rental-income"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={furnishedRentalIncome}
                                  onChange={(e) => setFurnishedRentalIncome(e.target.value)}
                                  className="block w-full"
                                />
                              </div>
                            </div>
                            
                            {furnishedRentalIncome && !isNaN(parseFloat(furnishedRentalIncome)) && (
                              <div className="sm:col-span-3 flex items-end">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                                  <div className="text-sm text-green-800">
                                    <strong>Wear & Tear Allowance: £{calculateWearAndTearAllowance().toFixed(2)}</strong>
                                    <div className="text-xs mt-1">10% of furnished rental income</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="sm:col-span-6">
                              <p className="text-xs text-gray-500">
                                You have {furnishedProperties} furnished {furnishedProperties === 1 ? 'property' : 'properties'} selected for tax calculations.
                                The wear and tear allowance covers the cost of replacing furniture and furnishings.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
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

            <div className="flex items-center justify-between gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <Button 
                type="button"
                outline
                onClick={() => router.push("/financial/tax/transactions")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <div className="flex gap-x-3">
                <Button 
                  type="button"
                  outline
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? "Saving..." : "Continue to Summary"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 