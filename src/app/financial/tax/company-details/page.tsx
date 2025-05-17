'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SidebarContent } from '../../../components/sidebar-content';
import { Input } from '../../../components/input';

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Company Details", href: "/financial/tax/company-details", status: "current" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "upcoming" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "upcoming" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

export default function CompanyDetails() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Company details state
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [utr, setUtr] = useState('');
  const [taxYear, setTaxYear] = useState('2023-2024');
  const [financialYearEnd, setFinancialYearEnd] = useState('');
  const [registeredOffice, setRegisteredOffice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!companyName || !companyNumber || !utr) {
      setError('Please complete all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real implementation, you would save the data to state/context or backend
    // For now, we'll just navigate to the next step
    setTimeout(() => {
      router.push('/financial/tax/properties');
    }, 500);
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Company Details
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your company information for tax filing purposes.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="px-4 py-6 sm:p-8">
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                      Company Name *
                    </label>
                    <div className="mt-1">
                      <Input
                        id="company-name"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="block w-full"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="company-number" className="block text-sm font-medium text-gray-700">
                      Company Registration Number *
                    </label>
                    <div className="mt-1">
                      <Input
                        id="company-number"
                        required
                        value={companyNumber}
                        onChange={(e) => setCompanyNumber(e.target.value)}
                        className="block w-full"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="utr" className="block text-sm font-medium text-gray-700">
                      Company UTR (Unique Taxpayer Reference) *
                    </label>
                    <div className="mt-1">
                      <Input
                        id="utr"
                        required
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="block w-full"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">10-digit number found on tax returns and letters from HMRC</p>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="financial-year-end" className="block text-sm font-medium text-gray-700">
                      Financial Year End Date
                    </label>
                    <div className="mt-1">
                      <Input
                        id="financial-year-end"
                        type="date"
                        value={financialYearEnd}
                        onChange={(e) => setFinancialYearEnd(e.target.value)}
                        className="block w-full"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Typically 12 months after incorporation date</p>
                  </div>

                  <div className="sm:col-span-full">
                    <label htmlFor="registered-address" className="block text-sm font-medium text-gray-700">
                      Registered Office Address
                    </label>
                    <div className="mt-1">
                      <Input
                        id="registered-address"
                        value={registeredOffice}
                        onChange={(e) => setRegisteredOffice(e.target.value)}
                        className="block w-full"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="tax-year" className="block text-sm font-medium text-gray-700">
                      Tax Year
                    </label>
                    <div className="mt-1">
                      <select
                        id="tax-year"
                        value={taxYear}
                        onChange={(e) => setTaxYear(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="2023-2024">2023-2024</option>
                        <option value="2022-2023">2022-2023</option>
                        <option value="2021-2022">2021-2022</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                <button type="button"
                  onClick={() => router.push("/financial/tax/company-or-personal")}
                  className="text-sm/6 font-semibold text-gray-900"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-sm/6 font-semibold text-gray-900"
                  disabled={isSubmitting}
                >
                  Save as Draft
                </button>
                <button type="submit"
                  className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 