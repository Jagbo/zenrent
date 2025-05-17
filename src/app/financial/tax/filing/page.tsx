"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { getAuthUser } from "@/lib/auth-helpers";
// Navbar removed as requested
import { toast } from 'sonner';
import { MTDSection } from './components/MTDSection';

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
const HMRC_AUTHORIZE_URL = "https://test-api.service.hmrc.gov.uk/oauth/authorize"; // Sandbox URL
const HMRC_CLIENT_ID = process.env.NEXT_PUBLIC_HMRC_CLIENT_ID; // Use NEXT_PUBLIC_ prefix
const HMRC_REDIRECT_URI = process.env.NEXT_PUBLIC_HMRC_REDIRECT_URI; // Use NEXT_PUBLIC_ prefix

export default function TaxFiling() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTaxYear, setCurrentTaxYear] = useState<string>("");
  
  // --- MTD State ---
  const [isHmrcConnected, setIsHmrcConnected] = useState<boolean | null>(null);
  const [hmrcConnectionError, setHmrcConnectionError] = useState<string | null>(null);
  const [mtdObligations, setMtdObligations] = useState<any[]>([]);
  const [mtdCompliance, setMtdCompliance] = useState<any>(null);
  const [mtdLoading, setMtdLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isFetchingMTDData, setIsFetchingMTDData] = useState(false);
  const [mtdData, setMtdData] = useState<any>(null);
  const [mtdDataError, setMtdDataError] = useState<string | null>(null);
  
  // Check HMRC connection status and handle OAuth callback params
  useEffect(() => {
    // Don't do anything until we have a userId
    if (!userId) return;
    
    const hmrcConnectedParam = searchParams.get('hmrc_connected');
    const hmrcErrorParam = searchParams.get('hmrc_error');
    const requestId = searchParams.get('request_id');

    if (hmrcConnectedParam === 'true') {
      setIsHmrcConnected(true);
      setHmrcConnectionError(null);
      toast.success("Successfully connected to HMRC.");
      
      // Clean the URL and then fetch MTD data
      router.replace(pathname, { scroll: false });
      
      // After successful connection, fetch MTD data
      // Use setTimeout to ensure the router has time to update
      setTimeout(() => {
        if (userId) fetchMTDData(userId);
      }, 500);
    } else if (hmrcErrorParam) {
      setIsHmrcConnected(false);
      setHmrcConnectionError(decodeURIComponent(hmrcErrorParam));
      toast.error(`HMRC Connection Error: ${decodeURIComponent(hmrcErrorParam)}`);
      
      // Clean the URL
      router.replace(pathname, { scroll: false }); 
    } else {
      // If no callback params, check backend for existing connection
      checkExistingConnection();
    }
    
    // Log the request ID if present (for debugging)
    if (requestId) {
      console.log(`HMRC OAuth request ID: ${requestId}`);
    }
  }, [searchParams, pathname, router, userId]);
  
  // Check existing HMRC connection
  const checkExistingConnection = async () => {
    if (!userId) {
      console.log('No user ID available, skipping HMRC connection check');
      return;
    }

    try {
      setIsCheckingConnection(true);
      console.log(`Checking HMRC connection status for user ${userId}`);
      
      // Use GET method with credentials included for authentication
      const response = await fetch(`/api/hmrc/connection-status`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - user needs to log in again
          console.error('Authentication required for HMRC connection check');
          setHmrcConnectionError('Authentication required. Please log in again.');
          // You could redirect to login page here if needed
        } else {
          const errorData = await response.json();
          console.error('Error checking HMRC connection:', errorData);
          setHmrcConnectionError(errorData.error || 'Failed to check HMRC connection');
        }
        setIsHmrcConnected(false);
        return;
      }

      const data = await response.json();
      console.log('HMRC connection status response:', data);
      setIsHmrcConnected(data.isConnected);
      
      if (data.isConnected) {
        // If connected, fetch MTD data
        fetchMTDData(userId);
      } else {
        // Clear any previous connection error if we got a valid response indicating not connected
        setHmrcConnectionError(null);
      }
    } catch (error) {
      console.error('Error checking HMRC connection:', error);
      setIsHmrcConnected(false);
      setHmrcConnectionError('Failed to check HMRC connection');
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // Load user data
  useEffect(() => {
    async function loadData() {
      try {
        const user = await getAuthUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUserId(user.id);
        
        // Calculate current tax year
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        
        // UK tax year runs from April 6 to April 5
        const taxYearStart = currentMonth >= 4 && now.getDate() >= 6 ? currentYear : currentYear - 1;
        const taxYearEnd = taxYearStart + 1;
        const taxYear = `${taxYearStart}-${taxYearEnd.toString().slice(2)}`;
        
        setCurrentTaxYear(taxYear);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [router]);
  
  // Fetch MTD data
  const fetchMTDData = async (userId: string) => {
    if (!userId) {
      console.log('No user ID available, skipping MTD data fetch');
      return;
    }
    
    try {
      setIsFetchingMTDData(true);
      console.log(`Fetching MTD data for user ${userId}`);
      
      const response = await fetch(`/api/hmrc/mtd-data`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication required for MTD data fetch');
          setMtdDataError('Authentication required. Please log in again.');
          setIsHmrcConnected(false); // Update connection status
        } else if (response.status === 403) {
          console.error('User is not connected to HMRC');
          setMtdDataError('Not connected to HMRC. Please connect your account.');
          setIsHmrcConnected(false); // Update connection status
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching MTD data:', response.status, errorData);
          setMtdDataError(errorData.error || `Failed to fetch MTD data: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('MTD data fetched successfully:', data);
      
      // Update state with the fetched data
      if (data.obligations) {
        setMtdObligations(data.obligations.data || []);
      }
      
      if (data.compliance) {
        setMtdCompliance(data.compliance.data || null);
      }
      
      // Update connection status and clear errors
      setIsHmrcConnected(true);
      setMtdDataError(null);
      setHmrcConnectionError(null);
    } catch (error) {
      console.error('Error fetching MTD data:', error);
      setMtdDataError('Failed to fetch MTD data from HMRC');
    } finally {
      setIsFetchingMTDData(false);
      setMtdLoading(false);
    }
  };
  
  // Initiate HMRC OAuth Flow
  const handleConnectToHmrc = () => {
    if (!HMRC_CLIENT_ID || !HMRC_REDIRECT_URI) {
      toast.error("HMRC connection configuration is missing. Please contact support.");
      return;
    }
    
    if (!userId) {
      toast.error("You must be logged in to connect to HMRC.");
      return;
    }
    
    try {
      // Generate a secure state value that includes the user ID for CSRF protection
      // and to verify the user on callback
      const randomPart = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const state = btoa(JSON.stringify({
        userId: userId,
        random: randomPart,
        timestamp: timestamp
      }));
      
      console.log(`Initiating HMRC connection for user ${userId}`);
      
      // Construct the authorization URL
      const authUrl = new URL(HMRC_AUTHORIZE_URL);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', HMRC_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', HMRC_REDIRECT_URI);
      authUrl.searchParams.append('scope', 'read:self-assessment write:self-assessment');
      authUrl.searchParams.append('state', state);
      
      // Add a request ID for debugging
      const requestId = `req_${randomPart}`;
      sessionStorage.setItem('hmrc_request_id', requestId);
      
      // Redirect to the authorization URL with the request ID
      const finalUrl = `${authUrl.toString()}&request_id=${requestId}`;
      console.log(`Redirecting to HMRC authorization: ${finalUrl}`);
      window.location.href = finalUrl;
    } catch (error) {
      console.error("Error connecting to HMRC:", error);
      toast.error("Failed to connect to HMRC. Please try again.");
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Filing</h1>
            <p className="mt-1 text-sm text-gray-500">
              Submit your tax returns and manage your Making Tax Digital compliance
            </p>
          </div>
        </div>
        
        {/* Tax Summary Navigation */}
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
                          <span className="text-xs md:text-sm text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="ml-3 md:ml-4 text-xs md:text-sm font-cabinet-grotesk font-medium text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}
                  
                  {stepIdx !== steps.length - 1 ? (
                    <div aria-hidden="true" className="absolute top-0 right-0 hidden h-full w-5 md:block">
                      <svg
                        fill="none"
                        viewBox="0 0 22 80"
                        preserveAspectRatio="none"
                        className="size-full text-gray-300"
                      >
                        <path
                          d="M0 -2L20 40L0 82"
                          stroke="currentcolor"
                          vectorEffect="non-scaling-stroke"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Tax Filing with Making Tax Digital
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              HMRC now requires digital record keeping and quarterly updates through Making Tax Digital
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="ml-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tax Year Information */}
                <div className="bg-gray-50 rounded-md p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Tax Year</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentTaxYear || "Not selected"}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Filing Steps Guide */}
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Filing Process</h3>
                  </div>
                  <div className="px-4 py-4 divide-y divide-gray-200">
                    {/* Step 1 */}
                    <div className="py-3 flex items-start">
                      <div className={`flex-shrink-0 flex items-center justify-center size-6 rounded-full ${isHmrcConnected ? 'bg-green-100' : 'bg-blue-100'} mt-1`}>
                        {isHmrcConnected ? (
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs font-medium text-blue-800">1</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {isHmrcConnected ? 'Connected to HMRC' : 'Connect to HMRC'}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {isHmrcConnected 
                            ? 'Your ZenRent account is connected to HMRC for Making Tax Digital.' 
                            : 'Connect your ZenRent account to HMRC to enable Making Tax Digital submissions.'}
                        </p>
                        {!isHmrcConnected && (
                          <button
                            type="button"
                            onClick={handleConnectToHmrc}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 bg-[#D9E8FF] hover:bg-[#D9E8FF]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9E8FF]"
                          >
                            Connect to HMRC
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="py-3 flex items-start">
                      <div className={`flex-shrink-0 flex items-center justify-center size-6 rounded-full ${mtdObligations.length > 0 ? 'bg-green-100' : 'bg-gray-100'} mt-1`}>
                        <span className="text-xs font-medium text-gray-800">2</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">View Your Obligations</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {isHmrcConnected 
                            ? 'Check your quarterly update obligations and submission deadlines.' 
                            : 'Connect to HMRC first to view your obligations.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="py-3 flex items-start">
                      <div className="flex-shrink-0 flex items-center justify-center size-6 rounded-full bg-gray-100 mt-1">
                        <span className="text-xs font-medium text-gray-800">3</span>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Submit Your Return</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {isHmrcConnected 
                            ? 'Submit your quarterly or annual tax return to HMRC.' 
                            : 'Connect to HMRC first to enable submissions.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {!isHmrcConnected && (
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Action Required</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Please connect to HMRC to continue with your tax filing. This is the first step in the Making Tax Digital process.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
        
        {/* MTD Section */}
        <MTDSection 
          onConnectClick={handleConnectToHmrc}
          isHmrcConnected={isHmrcConnected}
          taxYear={currentTaxYear}
        />
        
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
                  <h4 className="text-sm font-medium text-gray-900">Making Tax Digital (MTD)</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    MTD is a UK government initiative requiring digital record keeping and quarterly updates. ZenRent helps you stay compliant with these requirements.
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
                    Visit the <a href="https://www.gov.uk/government/collections/making-tax-digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">HMRC Making Tax Digital guidance</a> for official information about MTD requirements.
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
