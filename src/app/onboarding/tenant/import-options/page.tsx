"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { UserPlusIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'complete' },
  { id: '04', name: 'Tenants', href: '/onboarding/tenant/import-options', status: 'current' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

// Import options
const importOptions = [
  {
    id: 'manual',
    title: 'Add tenants manually',
    description: 'Enter tenant details through a guided form.',
    icon: UserPlusIcon,
  },
  {
    id: 'spreadsheet',
    title: 'Import from spreadsheet',
    description: 'Upload tenant details via an Excel or CSV template.',
    icon: UserPlusIcon,
  }
];

export default function TenantImportOptions() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (!selectedOption) {
      alert('Please select an import option');
      return;
    }
    
    // Navigate based on selected option
    switch (selectedOption) {
      case 'manual':
        router.push('/onboarding/tenant/tenancy-setup');
        break;
      case 'spreadsheet':
        router.push('/onboarding/tenant/spreadsheet-import');
        break;
      default:
        console.error('Unknown option selected');
    }
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
            <ol role="list" className="flex overflow-x-auto border border-gray-300 rounded-md">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIconSolid aria-hidden="true" className="size-4 sm:size-6 text-white" />
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                          <span className="text-xs sm:text-sm text-indigo-600">{step.id}</span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-indigo-600">{step.name}</span>
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator - hide on mobile, show on desktop */}
                      <div aria-hidden="true" className="absolute top-0 right-0 hidden md:block h-full w-5">
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
            <h2 className="text-base/7 font-semibold text-gray-900">Tenant Import Options</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Choose how you want to add your tenants to the system.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Import Options */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Select Import Method</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Choose the method that works best for you to add your tenants.
                  </p>
                  
                  <div className="mt-4 flex flex-col space-y-4">
                    {importOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`relative flex cursor-pointer rounded-lg border ${
                          selectedOption === option.id
                            ? 'border-indigo-600 ring-2 ring-indigo-600'
                            : 'border-gray-300 hover:border-indigo-400'
                        } bg-white p-4 shadow-sm focus:outline-none`}
                        onClick={() => handleOptionSelect(option.id)}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <option.icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                            </div>
                            <div className="ml-4 text-sm">
                              <p className="font-medium text-gray-900">{option.title}</p>
                              <p className="text-gray-500">{option.description}</p>
                            </div>
                          </div>
                          <div className={`h-5 w-5 rounded-full border ${
                            selectedOption === option.id
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-gray-300 bg-white'
                          } flex items-center justify-center`}>
                            {selectedOption === option.id && (
                              <div className="h-2.5 w-2.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Import Guidance */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Import Guidance</h2>
                  
                  <div className="mt-4 rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Tips for a smooth import</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc space-y-1 pl-5">
                            <li>Ensure you have tenant contact details ready</li>
                            <li>For spreadsheet imports, use our template for best results</li>
                            <li>Manual entry is recommended for fewer than 5 tenants</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Data Protection Notice */}
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">Data Protection</h2>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      By importing tenant data, you confirm that you have the legal right to process this information and have informed your tenants accordingly. All data will be handled in accordance with our Privacy Policy and the UK GDPR.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm/6 font-semibold text-gray-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedOption}
                className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  selectedOption
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-indigo-400 cursor-not-allowed'
                }`}
              >
                Continue with Selected Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 