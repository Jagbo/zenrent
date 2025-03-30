"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon, TableCellsIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'current' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

const importOptions = [
  {
    id: 'manual',
    title: 'Add properties manually',
    description: 'Enter property details one by one through our guided form process.',
    icon: PlusCircleIcon,
    benefits: [
      'Best for landlords with a small number of properties',
      'Guided step-by-step process',
      'No preparation required'
    ]
  },
  {
    id: 'spreadsheet',
    title: 'Import from spreadsheet',
    description: 'Upload property details using our Excel or CSV template.',
    icon: TableCellsIcon,
    benefits: [
      'Ideal for multiple properties',
      'Bulk import saves time',
      'Familiar format for existing data'
    ]
  }
];

export default function PropertyImportOptions() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('');
  
  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (!selectedOption) {
      alert("Please select an import method to continue");
      return;
    }
    
    // Redirect based on selected option
    switch (selectedOption) {
      case 'manual':
        router.push('/onboarding/property/add-property');
        break;
      case 'spreadsheet':
        router.push('/onboarding/property/spreadsheet-import');
        break;
      default:
        router.push('/onboarding/property/add-property');
    }
  };

  return (
    <SidebarLayout 
      sidebar={<SideboardOnboardingContent />}
      isOnboarding={true}
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list" className="flex overflow-x-auto border border-gray-300 rounded-md bg-white">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-d9e8ff group-hover:bg-d9e8ff-80">
                          <CheckIconSolid aria-hidden="true" className="size-4 sm:size-6 text-gray-900" />
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-d9e8ff">
                          <span className="text-xs sm:text-sm text-gray-900">{step.id}</span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
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
            <h2 className="text-base/7 title-font text-gray-900">Property Portfolio</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Choose how you'd like to add your properties to ZenRent.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Import Options */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900">Select Import Method</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Choose the method that best suits your needs for adding properties.
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    {importOptions.map((option) => (
                      <div 
                        key={option.id}
                        className={`relative flex cursor-pointer rounded-lg border p-4 ${
                          selectedOption === option.id 
                            ? 'border-[#FF503E] bg-[#FF503E]/10' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleOptionSelect(option.id)}
                      >
                        <div className="mr-4 flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF503E]/10">
                          <option.icon className="size-6 text-gray-900" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">{option.title}</h3>
                              <p className="text-sm text-gray-500">{option.description}</p>
                            </div>
                            <div className="ml-3 flex h-5 items-center">
                              <input
                                id={`option-${option.id}`}
                                name="import-option"
                                type="radio"
                                checked={selectedOption === option.id}
                                onChange={() => handleOptionSelect(option.id)}
                                className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-[#FF503E] checked:bg-[#FF503E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF503E] disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
                              />
                            </div>
                          </div>
                          
                          <ul className="mt-2 space-y-1">
                            {option.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <CheckIcon className="mr-2 size-4 text-gray-900" aria-hidden="true" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Import Guidance */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900">Import Guidance</h2>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>For the best results when importing your properties:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Ensure all required fields are completed</li>
                      <li>Use consistent formatting for addresses</li>
                      <li>Include postcodes for all properties</li>
                      <li>Have property compliance documents ready to upload</li>
                      <li>Prepare financial details such as mortgage information and rental income</li>
                    </ul>
                  </div>
                </div>
                
                {/* Data Protection Notice */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <ShieldCheckIcon className="size-6 text-gray-900" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm title-font text-gray-900">Data Protection Notice</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Your property data is securely stored and processed in accordance with our 
                        <a href="#" className="text-gray-900 hover:text-gray-700"> Privacy Policy</a>. 
                        We use industry-standard encryption and security measures to protect your information.
                      </p>
                    </div>
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
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff"
              >
                Continue with selected method
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 