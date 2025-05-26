"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../../components/sidebar-layout";
import { getAuthUser } from "@/lib/auth-helpers";
import { toast } from 'sonner';
import Link from 'next/link';
import { TaxType } from '../components/TaxTypeSelector';

// Tax wizard progress steps (same as in filing page)
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "complete" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "complete" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "complete" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "complete" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "current" },
];

// Mock submission data for development
const mockSubmissions = [
  {
    id: 'sub-001',
    reference: 'MTD-1652345678',
    taxType: 'self-assessment',
    submissionDate: new Date(new Date().getFullYear(), 3, 15).toISOString(),
    status: 'Accepted',
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    periodEnd: new Date(new Date().getFullYear(), 2, 31).toISOString(),
    mtdCompliant: true
  },
  {
    id: 'sub-002',
    reference: 'MTD-1652345679',
    taxType: 'vat',
    submissionDate: new Date(new Date().getFullYear(), 2, 10).toISOString(),
    status: 'Accepted',
    periodStart: new Date(new Date().getFullYear() - 1, 9, 1).toISOString(),
    periodEnd: new Date(new Date().getFullYear() - 1, 11, 31).toISOString(),
    mtdCompliant: true
  },
  {
    id: 'sub-003',
    reference: 'MTD-1652345680',
    taxType: 'self-assessment',
    submissionDate: new Date(new Date().getFullYear() - 1, 11, 20).toISOString(),
    status: 'Accepted',
    periodStart: new Date(new Date().getFullYear() - 2, 3, 6).toISOString(),
    periodEnd: new Date(new Date().getFullYear() - 1, 3, 5).toISOString(),
    mtdCompliant: true
  }
];

export default function SubmissionsHistoryPage() {
  const router = useRouter();
  
  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filterTaxType, setFilterTaxType] = useState<TaxType | 'all'>('all');
  
  // Load user data and submissions
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getAuthUser();
        if (user && user.id) {
          setUserId(user.id);
          
          // Load submissions
          await loadSubmissions(user.id);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load user data. Please try again.");
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Load submissions
  const loadSubmissions = async (userId: string) => {
    try {
      // This would be an API call to get the user's submissions
      // For now, we'll use mock data
      const response = await fetch(`/api/tax/submissions?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        // Use mock data for development
        setSubmissions(mockSubmissions);
        console.warn('Using mock submission data for development');
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      // Fallback to mock data
      setSubmissions(mockSubmissions);
      console.warn('Using mock submission data due to error');
    }
  };
  
  // Filter submissions by tax type
  const filteredSubmissions = filterTaxType === 'all' 
    ? submissions 
    : submissions.filter(sub => sub.taxType === filterTaxType);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get tax type label
  const getTaxTypeLabel = (type: string) => {
    switch (type) {
      case 'vat':
        return 'VAT';
      case 'property-income':
        return 'Property Income (SA105)';
      case 'self-assessment':
        return 'Self Assessment';
      default:
        return type;
    }
  };
  
  return (
    <SidebarLayout>
      <div className="px-4 py-5 sm:px-6 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-4">
              <li>
                <div>
                  <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">Home</span>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <Link href="/financial" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Financial</Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <Link href="/financial/tax" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Tax</Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <Link href="/financial/tax/filing" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Filing</Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">Submissions</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        {/* Wizard steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
              {steps.map((step) => (
                <li key={step.id} className="md:flex-1">
                  <Link
                    href={step.href}
                    className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                      step.status === "current"
                        ? "border-indigo-600 hover:border-indigo-800"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {step.id}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        step.status === "current" ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
                Submission History
              </h3>
              <Link
                href="/financial/tax/filing"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Filing
              </Link>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {/* Filter controls */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <label htmlFor="tax-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Tax Type
                </label>
                <select
                  id="tax-type-filter"
                  value={filterTaxType}
                  onChange={(e) => setFilterTaxType(e.target.value as TaxType | 'all')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="property-income">Property Income (SA105)</option>
                  <option value="vat">VAT</option>
                  <option value="self-assessment">Self Assessment</option>
                </select>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  MTD Compliant
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="ml-2 text-sm text-gray-500">Loading submissions...</p>
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
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterTaxType === 'all' 
                    ? 'You haven\'t made any tax submissions yet.' 
                    : `You haven't made any ${getTaxTypeLabel(filterTaxType)} submissions yet.`}
                </p>
                <div className="mt-6">
                  <Link
                    href="/financial/tax/filing"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create New Submission
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Reference</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tax Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Submitted</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {submission.reference}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getTaxTypeLabel(submission.taxType)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(submission.periodStart)} - {formatDate(submission.periodEnd)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(submission.submissionDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            type="button"
                            onClick={() => {
                              // View submission details
                              toast.info(`Viewing details for ${submission.reference}`);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
