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
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "complete" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "current" },
];

export default function TaxFiling() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [formLinks, setFormLinks] = useState<{
    sa100Pdf: string | null;
    sa105Pdf: string | null;
    combinedPdf: string | null;
    timestamp: string | null;
  }>({
    sa100Pdf: null,
    sa105Pdf: null,
    combinedPdf: null,
    timestamp: null,
  });
  
  // Load user and tax data
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
            
            // Check if forms already exist
            const { data: forms, error: formsError } = await supabase
              .from("tax_forms")
              .select("*")
              .eq("user_id", user.id)
              .eq("tax_year", taxProfile.tax_year)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
              
            if (!formsError && forms) {
              setFormLinks({
                sa100Pdf: forms.sa100_url,
                sa105Pdf: forms.sa105_url,
                combinedPdf: forms.combined_url,
                timestamp: new Date(forms.created_at).toLocaleString(),
              });
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
  
  // Generate tax forms
  const handleGenerateForms = async () => {
    if (!userId || !currentTaxYear) {
      setError("Missing user information. Please complete prior steps.");
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      // Call form generation API
      const response = await fetch("/api/tax/generate-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          taxYear: currentTaxYear,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Form generation failed: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Simulate API response for now
      // In actual implementation, this would come from the API
      const generatedForms = {
        sa100Pdf: `https://example.com/tax-forms/${userId}/sa100-${currentTaxYear.replace("/", "-")}.pdf`,
        sa105Pdf: `https://example.com/tax-forms/${userId}/sa105-${currentTaxYear.replace("/", "-")}.pdf`,
        combinedPdf: `https://example.com/tax-forms/${userId}/complete-return-${currentTaxYear.replace("/", "-")}.pdf`,
        timestamp: new Date().toLocaleString(),
      };
      
      // Save form links to state
      setFormLinks(generatedForms);
      
      // Save to database
      const { error: saveError } = await supabase
        .from("tax_forms")
        .insert({
          user_id: userId,
          tax_year: currentTaxYear,
          sa100_url: generatedForms.sa100Pdf,
          sa105_url: generatedForms.sa105Pdf,
          combined_url: generatedForms.combinedPdf,
          status: "generated",
        });
        
      if (saveError) {
        console.error("Error saving form links:", saveError);
      }
      
    } catch (error) {
      console.error("Form generation error:", error);
      setError(error instanceof Error ? error.message : "Failed to generate tax forms");
    } finally {
      setGenerating(false);
    }
  };
  
  // Handle download combined tax return
  const handleDownloadForms = () => {
    if (formLinks.combinedPdf) {
      // In a real implementation, this would download the actual PDF
      // For now, just open in a new tab
      window.open(formLinks.combinedPdf, "_blank");
    }
  };
  
  // Handle HMRC redirect
  const handleSubmitToHMRC = () => {
    // This would redirect users to HMRC's self assessment portal
    // For now, just open HMRC website
    window.open("https://www.gov.uk/self-assessment-tax-returns/sending-return", "_blank");
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

        {/* Main Content */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Generate & Submit Your Tax Return
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Your tax forms are ready to be generated. Once complete, you can download them for your records or submit directly to HMRC.
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-6">
              {/* Tax Year & User Details */}
              <div className="bg-gray-50 rounded-md p-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userDetails?.first_name} {userDetails?.last_name}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">UTR</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userDetails?.utr || "Not provided"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Tax Year</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentTaxYear || "Not selected"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Filing Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formLinks.timestamp ? "Forms Generated" : "Not Generated"}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {/* Generate Forms Button */}
              {!formLinks.timestamp ? (
                <div className="text-center py-6">
                  <svg 
                    className="mx-auto h-12 w-12 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    Ready to Generate Your Tax Forms
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate your Self Assessment forms based on your tax summary.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleGenerateForms}
                      disabled={generating || loading}
                      className="inline-flex items-center rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Generate Tax Forms
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Forms Ready Section */
                <div className="space-y-6">
                  {/* Generation Info */}
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800">
                          Your tax forms have been generated successfully.
                        </p>
                        <p className="mt-1 text-xs text-green-700">
                          Generated on: {formLinks.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Available Forms */}
                  <div className="border rounded-md">
                    <h3 className="px-4 py-3 text-sm font-medium bg-gray-50 border-b">
                      Your Tax Forms
                    </h3>
                    
                    <ul className="divide-y divide-gray-200">
                      {formLinks.sa100Pdf && (
                        <li className="px-4 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                SA100 - Main Tax Return
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF document
                              </p>
                            </div>
                          </div>
                          <a 
                            href={formLinks.sa100Pdf} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View
                          </a>
                        </li>
                      )}
                      
                      {formLinks.sa105Pdf && (
                        <li className="px-4 py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                SA105 - UK Property
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF document
                              </p>
                            </div>
                          </div>
                          <a 
                            href={formLinks.sa105Pdf} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View
                          </a>
                        </li>
                      )}
                      
                      {formLinks.combinedPdf && (
                        <li className="px-4 py-4 flex items-center justify-between bg-gray-50">
                          <div className="flex items-center">
                            <svg className="flex-shrink-0 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Complete Tax Return (All Forms)
                              </p>
                              <p className="text-xs text-gray-500">
                                Combined PDF document
                              </p>
                            </div>
                          </div>
                          <a 
                            href={formLinks.combinedPdf} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Filing Instructions */}
                  <div className="bg-blue-50 border rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800">Filing Instructions</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You have two options for filing your tax return:</p>
                      <ol className="list-decimal ml-4 mt-2 space-y-1">
                        <li>Download your tax forms and upload them to the HMRC Self Assessment portal.</li>
                        <li>Fill in the online Self Assessment directly on the HMRC website using the figures from these forms.</li>
                      </ol>
                      <p className="mt-2">
                        Remember, the deadline for online submission is January 31, {parseInt(currentTaxYear.split('/')[1])} for the {currentTaxYear} tax year.
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      onClick={handleDownloadForms}
                      className="flex-1 inline-flex justify-center items-center rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Complete Return
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSubmitToHMRC}
                      className="flex-1 inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Go to HMRC Self Assessment
                    </button>
                  </div>
                  
                  {/* Regenerate Option */}
                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={handleGenerateForms}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Regenerate forms
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      If you've made changes to your tax data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-between">
            <button type="button"
              onClick={() => router.push("/financial/tax/summary")}
              className="text-sm/6 font-semibold text-gray-900"
            >
              Back to Summary
            </button>
            
            <button type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs border border-gray-300 hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Need Help?
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Tax advice disclaimer</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    ZenRent provides tools to help prepare your tax return but does not provide tax advice. For personalised tax advice, please consult a qualified accountant.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Contact ZenRent Support</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    If you need assistance with using the tax assistant, please contact us at <a href="mailto:support@zenrent.co.uk" className="text-blue-600 hover:text-blue-500">support@zenrent.co.uk</a>
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">HMRC Resources</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Visit the <a href="https://www.gov.uk/self-assessment-tax-returns" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">HMRC Self Assessment guidance</a> for official information about tax returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 