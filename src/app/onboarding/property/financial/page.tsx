"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { CalendarIcon, QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'current' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

export default function PropertyFinancial() {
  const router = useRouter();
  
  // State for form fields
  const [formData, setFormData] = useState({
    // Rental Details
    monthlyRent: '',
    depositAmount: '',
    rentalFrequency: 'Monthly',
    depositScheme: '',
    availableFrom: '',
    
    // Mortgage Information
    mortgageLender: '',
    monthlyPayment: '',
    interestRate: '',
    fixedTermEndDate: '',
    
    // Insurance Information
    insuranceProvider: '',
    policyNumber: '',
    renewalDate: '',
    
    // Additional Costs
    regularExpenses: '',
    managementFees: ''
  });
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.monthlyRent || !formData.depositAmount || !formData.depositScheme) {
      alert('Please fill in all required fields');
      return;
    }
    
    // In a real application, you would save the data here
    console.log('Form data submitted:', formData);
    
    // Navigate to the next step
    router.push('/onboarding/property/media');
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    // In a real application, you would save the draft here
    console.log('Form data saved as draft:', formData);
    alert('Your property financial details have been saved as draft');
  };

  return (
    <SidebarLayout 
      sidebar={<SideboardOnboardingContent />}
      isOnboarding={true}
    >
      <div className="divide-y divide-gray-900/10">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIconSolid aria-hidden="true" className="size-6 text-white" />
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                        <span className="text-indigo-600">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-indigo-600">{step.name}</span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true" className="absolute top-0 right-0 hidden h-full w-5 md:block">
                        <svg fill="none" viewBox="0 0 22 80" preserveAspectRatio="none" className="size-full text-gray-300">
                          <path
                            d="M0 -2L20 40L0 82"
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-semibold text-gray-900">Property Financial Details</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Enter the financial information related to your property to help us set up income tracking and expense management.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Rental Details */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Rental Details</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Information about the rental terms and deposit for this property.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="monthlyRent" className="block text-sm font-medium leading-6 text-gray-900">
                        Monthly rent amount (£) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">£</span>
                        </div>
                        <input
                          type="text"
                          name="monthlyRent"
                          id="monthlyRent"
                          required
                          value={formData.monthlyRent}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-12 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="depositAmount" className="block text-sm font-medium leading-6 text-gray-900">
                        Deposit amount (£) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">£</span>
                        </div>
                        <input
                          type="text"
                          name="depositAmount"
                          id="depositAmount"
                          required
                          value={formData.depositAmount}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-12 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="rentalFrequency" className="block text-sm font-medium leading-6 text-gray-900">
                        Rental frequency
                      </label>
                      <div className="mt-2">
                        <select
                          id="rentalFrequency"
                          name="rentalFrequency"
                          value={formData.rentalFrequency}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option>Monthly</option>
                          <option>Weekly</option>
                          <option>Quarterly</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="depositScheme" className="block text-sm font-medium leading-6 text-gray-900">
                        Rental deposit scheme <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <select
                          id="depositScheme"
                          name="depositScheme"
                          required
                          value={formData.depositScheme}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="">Select a scheme</option>
                          <option value="DPS">DPS (Deposit Protection Service)</option>
                          <option value="mydeposits">mydeposits</option>
                          <option value="TDS">TDS (Tenancy Deposit Scheme)</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="availableFrom" className="block text-sm font-medium leading-6 text-gray-900">
                        Date property available from
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="date"
                          name="availableFrom"
                          id="availableFrom"
                          value={formData.availableFrom}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pr-10 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mortgage Information */}
                <div className="border-b border-gray-900/10 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base/7 font-semibold text-gray-900">Mortgage Information</h2>
                      <p className="mt-1 text-sm/6 text-gray-600">
                        Optional details about the mortgage on this property.
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Optional
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="mortgageLender" className="block text-sm font-medium leading-6 text-gray-900">
                        Mortgage lender
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="mortgageLender"
                          id="mortgageLender"
                          value={formData.mortgageLender}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="monthlyPayment" className="block text-sm font-medium leading-6 text-gray-900">
                        Monthly payment (£)
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">£</span>
                        </div>
                        <input
                          type="text"
                          name="monthlyPayment"
                          id="monthlyPayment"
                          value={formData.monthlyPayment}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-12 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="interestRate" className="block text-sm font-medium leading-6 text-gray-900">
                        Interest rate (%)
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="text"
                          name="interestRate"
                          id="interestRate"
                          value={formData.interestRate}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pr-10 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="fixedTermEndDate" className="block text-sm font-medium leading-6 text-gray-900">
                        Fixed term end date
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="date"
                          name="fixedTermEndDate"
                          id="fixedTermEndDate"
                          value={formData.fixedTermEndDate}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pr-10 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Insurance Information */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Insurance Information</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Details about your landlord insurance policy for this property.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="insuranceProvider" className="block text-sm font-medium leading-6 text-gray-900">
                        Landlord insurance provider
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="insuranceProvider"
                          id="insuranceProvider"
                          value={formData.insuranceProvider}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="policyNumber" className="block text-sm font-medium leading-6 text-gray-900">
                        Policy number
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="policyNumber"
                          id="policyNumber"
                          value={formData.policyNumber}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="renewalDate" className="block text-sm font-medium leading-6 text-gray-900">
                        Renewal date
                      </label>
                      <div className="relative mt-2">
                        <input
                          type="date"
                          name="renewalDate"
                          id="renewalDate"
                          value={formData.renewalDate}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pr-10 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Costs */}
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">Additional Costs</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Regular expenses associated with this property.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="regularExpenses" className="block text-sm font-medium leading-6 text-gray-900">
                        Regular expenses (£/month)
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">£</span>
                        </div>
                        <input
                          type="text"
                          name="regularExpenses"
                          id="regularExpenses"
                          value={formData.regularExpenses}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-12 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Include utility bills, service charges, ground rent, etc.
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="managementFees" className="block text-sm font-medium leading-6 text-gray-900">
                        Management fees (£/month)
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">£</span>
                        </div>
                        <input
                          type="text"
                          name="managementFees"
                          id="managementFees"
                          value={formData.managementFees}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-12 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        If you use a property management service, enter the monthly fee.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save and Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 