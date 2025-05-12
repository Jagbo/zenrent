"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Button } from "../../../components/button";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { toast } from 'sonner';

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "complete" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "complete" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "complete" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "complete" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "current" },
];

// --- HMRC Config (Frontend needs Auth URL) ---
// We only need the client_id and redirect_uri on the frontend to build the auth link
// Ensure these are exposed safely, e.g., via NEXT_PUBLIC_ variables
const HMRC_AUTHORIZE_URL = "https://test-api.service.hmrc.gov.uk/oauth/authorize"; // Sandbox URL
const HMRC_CLIENT_ID = process.env.NEXT_PUBLIC_HMRC_CLIENT_ID; // Use NEXT_PUBLIC_ prefix
const HMRC_REDIRECT_URI = process.env.NEXT_PUBLIC_HMRC_REDIRECT_URI; // Use NEXT_PUBLIC_ prefix

// Interface for form links
interface FormLinks {
  sa100Pdf: string | null;
  sa105Pdf: string | null;
  combinedPdf: string | null;
  timestamp: string | null;
}

export default function TaxFiling() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Hook to read query parameters
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [formLinks, setFormLinks] = useState<FormLinks>({
    sa100Pdf: null,
    sa105Pdf: null,
    combinedPdf: null,
    timestamp: null,
  });
  const [formStatus, setFormStatus] = useState<string>("idle");
  
  // --- New State for HMRC Integration ---
  const [isHmrcConnected, setIsHmrcConnected] = useState<boolean | null>(null); // null = checking, false = not connected, true = connected
  const [hmrcConnectionError, setHmrcConnectionError] = useState<string | null>(null);
  const [isSubmittingToHmrc, setIsSubmittingToHmrc] = useState(false);
  const [hmrcSubmissionStatus, setHmrcSubmissionStatus] = useState<{
    status: 'idle' | 'submitting' | 'success' | 'error';
    message: string | null;
    reference: string | null;
  }>({ status: 'idle', message: null, reference: null });
  
  // Check HMRC connection status and handle OAuth callback params
  useEffect(() => {
    const hmrcConnectedParam = searchParams.get('hmrc_connected');
    const hmrcErrorParam = searchParams.get('hmrc_error');

    if (hmrcConnectedParam === 'true') {
      setIsHmrcConnected(true);
      setHmrcConnectionError(null);
      toast.success("Successfully connected to HMRC.");
      // Clean the URL
      router.replace(pathname, { scroll: false }); 
    } else if (hmrcErrorParam) {
      setIsHmrcConnected(false);
      setHmrcConnectionError(decodeURIComponent(hmrcErrorParam));
      toast.error(`HMRC Connection Error: ${decodeURIComponent(hmrcErrorParam)}`);
      // Clean the URL
      router.replace(pathname, { scroll: false }); 
    } else {
      // If no callback params, check backend for existing connection
      async function checkExistingConnection() {
        if (!userId) return; // Need userId to check
        console.log("[HMRC Connect] Checking existing connection status...");
        try {
          // Use the regular production endpoint (no debug)
          // For ngrok compatibility, we need to pass the userId in the request
          const response = await fetch('/api/hmrc/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("[HMRC Connect] Connection status from backend:", data);
            setIsHmrcConnected(data.isConnected);
            if (!data.isConnected) {
              setHmrcConnectionError("Not currently connected to HMRC. Please connect to continue.");
            } else {
              setHmrcConnectionError(null);
            }
          } else {
            // Connection check failed, assume not connected
            console.warn("[HMRC Connect] Failed to check backend status");
            setIsHmrcConnected(false);
            setHmrcConnectionError("Unable to verify HMRC connection. Please connect to continue.");
          }
        } catch (err) {
          console.error("[HMRC Connect] Error checking connection status:", err);
          setIsHmrcConnected(false);
          setHmrcConnectionError("Error checking HMRC connection status. Please try connecting again.");
        }
      }
      // Only check if connection status is unknown (null)
      if (isHmrcConnected === null && userId) {
           checkExistingConnection();
      }
    }
  }, [searchParams, pathname, router, userId, isHmrcConnected]); // Add userId and isHmrcConnected dependency

  // Fetch user data and forms on mount
  useEffect(() => {
    // Set a default tax year
    const currentYear = new Date().getFullYear();
    setCurrentTaxYear(`${currentYear}/${currentYear + 1}`);
    
    // Simulate getting user ID from context/auth
    const mockUserId = "fd98eb7b-e2a1-488b-a669-d34c914202b1"; // Your provided user ID
    setUserId(mockUserId);
    
    // Mock user data (in a real app, this would be fetched from API)
    setUserDetails({
      name: "James Anderson",
      utr: "1234567890",
      nino: "AB123456C"
    });
    
    // This will run once userId and taxYear are set
  }, []);
  
  // Fetch existing forms when userId or taxYear changes
  useEffect(() => {
    if (userId && currentTaxYear) {
      fetchExistingForms();
    }
  }, [userId, currentTaxYear]);

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
  
  // Fetch existing tax forms for the user
  const fetchExistingForms = async () => {
    if (!userId || !currentTaxYear) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/financial/tax/forms?userId=${userId}&taxYear=${currentTaxYear}`);
      
      if (response.ok) {
        const forms = await response.json();
        if (forms && forms.sa100_url) {
          // Accept both Supabase storage URLs and placeholder/demo URLs
          const isValidUrl = (url: string) => url && 
            (url.includes('storage.googleapis.com') || 
             url.includes('supabase.co/storage/v1/object/public') || 
             url.includes('supabase.co/storage/v1/object/sign') ||
             url.includes('s3.amazonaws.com'));
          
          if (isValidUrl(forms.sa100_url) && isValidUrl(forms.sa105_url) && isValidUrl(forms.combined_url)) {
            // Save form links to state - valid URLs
            setFormLinks({
              sa100Pdf: forms.sa100_url,
              sa105Pdf: forms.sa105_url,
              combinedPdf: forms.combined_url,
              timestamp: new Date(forms.created_at).toLocaleString(),
            });
            setFormStatus("generated");
          } else {
            // URLs are example links or invalid - clear form links and set form status to idle
            console.warn("Invalid form URLs detected - example links found:", forms);
            setFormLinks({
              sa100Pdf: null,
              sa105Pdf: null,
              combinedPdf: null,
              timestamp: null,
            });
            setFormStatus("idle");
            
            // Delete the invalid record from the database
            try {
              await fetch(`/api/financial/tax/forms?userId=${userId}&taxYear=${currentTaxYear}`, {
                method: 'DELETE'
              });
            } catch (deleteError) {
              console.error("Failed to delete invalid form record:", deleteError);
            }
          }
        } else {
          // No forms found
          setFormLinks({
            sa100Pdf: null,
            sa105Pdf: null,
            combinedPdf: null,
            timestamp: null,
          });
          setFormStatus("idle");
        }
      } else {
        // Handle error response
        console.error("Error fetching forms:", response.statusText);
        setFormStatus("idle");
      }
    } catch (error) {
      console.error("Error fetching existing forms:", error);
      setFormStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  // Generate tax forms
  const handleGenerateForms = async () => {
    if (!userId || !currentTaxYear) {
      setError("Missing user information. Please complete prior steps.");
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log("Starting form generation with user ID:", userId.substring(0, 8) + "...");
      // Call form generation API
      const response = await fetch("/api/financial/tax/generate-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          taxYear: currentTaxYear,
        }),
      });
      
      // Try to parse the response body
      let responseData;
      try {
        responseData = await response.json();
        console.log("API response received:", JSON.stringify(responseData).substring(0, 100) + "...");
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        throw new Error("Received invalid response from server. Please try again later.");
      }
      
      if (!response.ok) {
        // Create a more helpful error message
        let errorMessage = "Failed to generate tax forms";
        
        if (responseData?.error) {
          // Handle specific error cases with user-friendly messages
          if (responseData.error.includes("PDF font") || 
              responseData.error.includes("ENOENT") || 
              responseData.error.includes("font") ||
              responseData.error.includes("PDF generation failed")) {
            errorMessage = "Unable to generate PDF forms. Please try again or contact support if the issue persists.";
            console.error("PDF generation technical error:", responseData.error);
          } else if (responseData.error.includes("Invalid user ID")) {
            errorMessage = "Your user account appears to be invalid. Please try logging out and back in.";
          } else if (responseData.error.includes("upload")) {
            errorMessage = "There was a problem storing your generated forms. Please try again later.";
          } else {
            // Use the error from the API if available
            errorMessage = responseData.error;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Success - we have form URLs
      if (!responseData.sa100Pdf || !responseData.sa105Pdf || !responseData.combinedPdf) {
        console.error("Incomplete form data received:", responseData);
        throw new Error("The server generated incomplete form data. Please try again.");
      }
      
      console.log("Received URL for SA100:", responseData.sa100Pdf);
      console.log("Received URL for SA105:", responseData.sa105Pdf);
      console.log("Received URL for combined:", responseData.combinedPdf);
      
      // Use the response data from the API
      const generatedForms = {
        sa100Pdf: responseData.sa100Pdf,
        sa105Pdf: responseData.sa105Pdf,
        combinedPdf: responseData.combinedPdf,
        timestamp: responseData.timestamp ? new Date(responseData.timestamp).toLocaleString() : new Date().toLocaleString(),
      };
      
      console.log("Forms generated successfully, updating state");
      
      // Save form links to state
      setFormLinks(generatedForms);
      
      // Show success message
      toast.success(responseData.message || "Tax forms generated successfully");
      
      // Update forms in database
      fetchExistingForms();
    } catch (error) {
      console.error("Form generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate tax forms";
      setError(errorMessage);
      
      // Log detailed error information for debugging
      if (error instanceof Error && error.stack) {
        console.error("Detailed error stack:", error.stack);
      }
      
      // Show error toast
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Handle download combined tax return
  const handleDownloadForms = () => {
    if (formLinks.combinedPdf) {
      // Open in a new tab for download
      window.open(formLinks.combinedPdf, "_blank");
    }
  };

  // Handle Submission to HMRC via Backend API
  const handleSubmitToHMRC = async () => {
    if (!userId || !currentTaxYear || !isHmrcConnected) {
      setError("Cannot submit. Ensure you are connected to HMRC and tax year is set.");
      return;
    }

    setIsSubmittingToHmrc(true);
    setHmrcSubmissionStatus({ status: 'submitting', message: 'Submitting to HMRC...', reference: null });
    setError(null);
    toast.loading("Submitting tax return to HMRC...");

    // --- Gather Fraud Prevention Data --- 
    let fraudHeadersData = {};
    try {
      // Basic browser/window info
      const screenWidth = window.screen?.width || 0;
      const screenHeight = window.screen?.height || 0;
      const windowWidth = window.innerWidth || 0;
      const windowHeight = window.innerHeight || 0;
      
      fraudHeadersData = {
        userAgent: navigator.userAgent || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
        screenDetails: `${screenWidth}x${screenHeight}x${window.screen?.colorDepth || 0}`,
        windowSize: `${windowWidth}x${windowHeight}`,
        // --- Placeholders for harder-to-get data ---
        deviceId: 'placeholder-device-id', // TODO: Implement robust device ID generation/retrieval
        localIps: 'placeholder-local-ip', // TODO: Find way to get local IP if possible/needed
        // Add timestamp for local IPs if you manage to get them
      };
      console.log("[HMRC Submit] Collected Fraud Headers Data:", fraudHeadersData);
    } catch (e) {
        console.warn("[HMRC Submit] Could not collect all fraud prevention data:", e);
        // Decide if submission should proceed without full data
    }
    // --- End Gather Fraud Prevention Data ---

    try {
      const response = await fetch("/api/financial/tax/submit-hmrc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId, // CRITICAL: Always pass userId for ngrok compatibility
          taxYear: currentTaxYear,
          submissionType: 'SA-FULL',
          // Pass the collected fraud header data to the backend
          fraudHeaders: fraudHeadersData, 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HMRC submission failed with status ${response.status}`);
      }

      setHmrcSubmissionStatus({ 
        status: 'success', 
        message: 'Submission successful!', 
        reference: result.hmrcReference || result.submissionId || 'N/A' 
      });
      toast.success(`Submission successful! Ref: ${result.hmrcReference || result.submissionId || 'N/A'}`);

    } catch (error) {
      console.error("HMRC Submission error:", error);
      const message = error instanceof Error ? error.message : "Failed to submit to HMRC";
      setError(message);
      setHmrcSubmissionStatus({ status: 'error', message: message, reference: null });
      toast.error(`Submission failed: ${message}`);
    } finally {
      setIsSubmittingToHmrc(false);
      toast.dismiss(); // Dismiss loading toast
    }
  };
  
  // Initiate HMRC OAuth Flow
  const handleConnectToHmrc = async () => {
    if (!HMRC_CLIENT_ID || !HMRC_REDIRECT_URI) {
      setError("HMRC connection is not configured correctly. Please contact support.");
      return;
    }
    
    // Define required scopes (adjust as needed based on API usage)
    const scopes = "read:self-assessment write:self-assessment"; 
    
    // Get current user ID to include in state
    let stateValue = Math.random().toString(36).substring(2);
    
    // Include user ID in state if available
    if (userId) {
      stateValue = `${userId}:${stateValue}`;
    }

    const authUrl = `${HMRC_AUTHORIZE_URL}?` + 
                    `response_type=code&` +
                    `client_id=${encodeURIComponent(HMRC_CLIENT_ID)}&` +
                    `scope=${encodeURIComponent(scopes)}&` +
                    `redirect_uri=${encodeURIComponent(HMRC_REDIRECT_URI)}&` +
                    `state=${encodeURIComponent(stateValue)}`;

    // Redirect user to HMRC for authorization
    window.location.href = authUrl;
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
              
              {/* --- HMRC Connection Section --- */} 
              <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">HMRC Connection</h3>
                  {isHmrcConnected === null && (
                      <p className="text-sm text-gray-500">Checking connection status...</p>
                  )}
                  {isHmrcConnected === false && (
                      <div className="space-y-2">
                          <p className="text-sm text-red-600">
                              Not connected to HMRC. You need to authorize ZenRent to submit returns on your behalf.
                          </p>
                          {hmrcConnectionError && (
                               <p className="text-xs text-red-500">Error: {hmrcConnectionError}</p>
                          )}
                          <Button 
                              color="indigo" 
                              onClick={handleConnectToHmrc}
                              disabled={!HMRC_CLIENT_ID || !HMRC_REDIRECT_URI} // Disable if config missing
                          >
                              Connect to HMRC
                          </Button>
                      </div>
                  )}
                  {isHmrcConnected === true && (
                       <div className="flex items-center space-x-2">
                           <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                           </svg>
                           <p className="text-sm text-green-700 font-medium">Connected to HMRC</p>
                           {/* Optional: Add disconnect button */} 
                       </div>
                  )}
              </div>
              {/* --- End HMRC Connection Section --- */} 

              {/* Generate Forms Button or Forms Ready Section */}
              {!formLinks.timestamp && (
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
              )}

              {/* Forms Ready Section */}
              {formLinks.timestamp && (
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
                  
                  {/* Available Forms - Simple List Style */}
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
                  
                  {/* --- Filing Section --- */}
                  <div className="bg-blue-50 border rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800">Submit Your Return</h3>
                    {hmrcSubmissionStatus.status === 'idle' && (
                        <p className="mt-2 text-sm text-blue-700">
                          Once you are ready and connected to HMRC, you can submit your tax return directly.
                        </p>
                    )}
                    {hmrcSubmissionStatus.status === 'submitting' && (
                        <p className="mt-2 text-sm text-blue-700">{hmrcSubmissionStatus.message}</p>
                    )}
                     {hmrcSubmissionStatus.status === 'success' && (
                        <div className="mt-2 text-sm text-green-700">
                           <p>{hmrcSubmissionStatus.message}</p>
                           <p>HMRC Reference: <strong>{hmrcSubmissionStatus.reference}</strong></p>
                        </div>
                    )}
                     {hmrcSubmissionStatus.status === 'error' && (
                        <p className="mt-2 text-sm text-red-600">Error: {hmrcSubmissionStatus.message}</p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      onClick={handleDownloadForms}
                      className="flex-1 inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Return (PDF)
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSubmitToHMRC}
                      disabled={!isHmrcConnected || isSubmittingToHmrc || hmrcSubmissionStatus.status === 'success'}
                      className="flex-1 inline-flex justify-center items-center rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingToHmrc ? (
                         <> {/* Submitting spinner */}
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                         </>
                      ) : hmrcSubmissionStatus.status === 'success' ? (
                         <> {/* Success check */}
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Submitted
                         </>
                      ) : (
                         <> {/* Default state */}
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Submit to HMRC
                         </>
                      )}
                    </button>
                  </div>
                  {/* End Filing Section */} 
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