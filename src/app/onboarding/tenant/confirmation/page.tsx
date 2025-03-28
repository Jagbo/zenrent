"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'complete' },
  { id: '04', name: 'Tenants', href: '/onboarding/tenant/import-options', status: 'current' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

export default function TenantConfirmation() {
  const router = useRouter();
  
  // State for tenancy data
  const [tenancyData, setTenancyData] = useState<any>(null);
  // State for saved properties
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  // State to track the current property index
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  
  // Load tenancy data and saved properties from localStorage on component mount
  useEffect(() => {
    try {
      console.log('Loading data in confirmation page');
      
      const savedTenancy = localStorage.getItem('tenancyData');
      console.log('Raw tenancy data:', savedTenancy);
      
      if (savedTenancy) {
        setTenancyData(JSON.parse(savedTenancy));
      }
      
      // Load saved properties
      const savedPropertiesString = localStorage.getItem('savedProperties');
      console.log('Saved properties string:', savedPropertiesString);
      
      const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      console.log('Parsed saved properties:', existingProperties);
      setSavedProperties(existingProperties);
      
      // Determine current property index
      const currentPropertyString = localStorage.getItem('propertyData');
      console.log('Current property string:', currentPropertyString);
      
      const currentProperty = JSON.parse(localStorage.getItem('propertyData') || '{}');
      console.log('Current property:', currentProperty);
      
      if (currentProperty && currentProperty.address) {
        const index = existingProperties.findIndex((prop: any) => 
          prop.address === currentProperty.address);
        console.log('Found property at index:', index, 'with address:', currentProperty.address);
        
        if (index !== -1) {
          setCurrentPropertyIndex(index);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);
  
  const handleContinue = () => {
    console.log('Handle continue clicked');
    console.log('Current property index:', currentPropertyIndex);
    console.log('Total properties:', savedProperties.length);
    
    // Check if there are more properties to set up tenants for
    if (savedProperties.length > 1 && currentPropertyIndex < savedProperties.length - 1) {
      console.log('Setting up next property');
      
      // Set the next property as the current property
      const nextProperty = savedProperties[currentPropertyIndex + 1];
      console.log('Next property:', nextProperty);
      
      localStorage.setItem('propertyData', JSON.stringify(nextProperty));
      
      // Redirect back to tenancy setup
      router.push('/onboarding/tenant/tenancy-setup');
    } else {
      console.log('Moving to complete page - no more properties');
      // No more properties, continue to next step
      router.push('/onboarding/tenant/complete');
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  // Format currency
  const formatCurrency = (amount: string) => {
    if (!amount) return '';
    return `£${parseFloat(amount).toFixed(2)}`;
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
            <ol role="list" className="flex overflow-x-auto border border-gray-300 rounded-md bg-white">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <CheckIconSolid aria-hidden="true" className="size-4 sm:size-6 text-white" />
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
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
            <h2 className="text-base/7 title-font text-gray-900">Tenant Confirmation</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Review and confirm your tenant information.
            </p>
            {savedProperties.length > 1 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Property {currentPropertyIndex + 1} of {savedProperties.length}
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      {currentPropertyIndex < savedProperties.length - 1 
                        ? "You'll set up tenants for your next property after this confirmation."
                        : "This is the last property in your portfolio."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            {tenancyData ? (
              <div className="px-4 py-6 sm:p-8">
                {tenancyData && tenancyData.property.isHmo ? (
                  <>
                    {/* For HMO Properties - Show individual room tenants */}
                    <div className="pt-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Room Tenants</h3>
                      <div className="mt-3 space-y-4">
                        {tenancyData.tenants.map((tenant: any, index: number) => (
                          <div key={index} className="rounded-md border border-gray-200 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Room {tenant.roomNumber}
                            </h4>
                            
                            {/* Tenant Information */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.firstName} {tenant.lastName}</dd>
                                </div>
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                                </div>
                                {tenant.phoneNumber && (
                                  <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{tenant.phoneNumber}</dd>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Room Tenancy Type */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Room Tenancy Type</h5>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Agreement Type</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.agreementType}</dd>
                                </div>
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Tenancy Term</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.tenancyTerm}</dd>
                                </div>
                              </div>
                            </div>
                            
                            {/* Room Tenancy Details */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Room Tenancy</h5>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{formatDate(tenant.startDate)}</dd>
                                </div>
                                {tenant.endDate && (
                                  <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formatDate(tenant.endDate)}</dd>
                                  </div>
                                )}
                                {tenant.hasBreakClause && tenant.breakClauseDetails && (
                                  <div className="sm:col-span-6">
                                    <dt className="text-sm font-medium text-gray-500">Break Clause</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{tenant.breakClauseDetails}</dd>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Room Rent Details */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Room Rent</h5>
                              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Rent Amount</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(tenant.rentAmount)}</dd>
                                </div>
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.rentFrequency}</dd>
                                </div>
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Due Day</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.rentDueDay}</dd>
                                </div>
                              </div>
                            </div>
                            
                            {/* Room Deposit Details */}
                            {tenant.depositAmount && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Room Deposit</h5>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                                  <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Deposit Amount</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(tenant.depositAmount)}</dd>
                                  </div>
                                  {tenant.depositScheme && (
                                    <div className="sm:col-span-3">
                                      <dt className="text-sm font-medium text-gray-500">Deposit Scheme</dt>
                                      <dd className="mt-1 text-sm text-gray-900">{tenant.depositScheme}</dd>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Property Information */}
                    <div className="border-b border-gray-900/10 pb-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Property Information</h3>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <p className="text-sm font-medium text-gray-900">{tenancyData.property.address}</p>
                          <p className="text-sm text-gray-500">
                            {tenancyData.property.propertyType} • {tenancyData.property.bedrooms} {parseInt(tenancyData.property.bedrooms) > 1 ? 'Bedrooms' : 'Bedroom'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tenancy Agreement */}
                    <div className="border-b border-gray-900/10 py-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Tenancy Agreement</h3>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Agreement Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.agreementType}</dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Tenancy Term</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.tenancyTerm}</dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(tenancyData.tenancy.startDate)}</dd>
                        </div>
                        {tenancyData.tenancy.endDate && (
                          <div className="sm:col-span-3">
                            <dt className="text-sm font-medium text-gray-500">End Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(tenancyData.tenancy.endDate)}</dd>
                          </div>
                        )}
                        {tenancyData.tenancy.hasBreakClause && tenancyData.tenancy.breakClauseDetails && (
                          <div className="sm:col-span-6">
                            <dt className="text-sm font-medium text-gray-500">Break Clause</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.breakClauseDetails}</dd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rent Information */}
                    <div className="border-b border-gray-900/10 py-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Rent Information</h3>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Rent Amount</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatCurrency(tenancyData.tenancy.rentAmount)}</dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.rentFrequency}</dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Due Day</dt>
                          <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.rentDueDay}</dd>
                        </div>
                        {tenancyData.tenancy.paymentMethod && (
                          <div className="sm:col-span-3">
                            <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.paymentMethod}</dd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deposit Information */}
                    <div className="border-b border-gray-900/10 py-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Deposit Information</h3>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <dt className="text-sm font-medium text-gray-500">Deposit Amount</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatCurrency(tenancyData.tenancy.depositAmount)}</dd>
                        </div>
                        {tenancyData.tenancy.depositScheme && (
                          <div className="sm:col-span-3">
                            <dt className="text-sm font-medium text-gray-500">Deposit Scheme</dt>
                            <dd className="mt-1 text-sm text-gray-900">{tenancyData.tenancy.depositScheme}</dd>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tenant Information */}
                    <div className="pt-6">
                      <h3 className="text-base font-semibold leading-7 text-gray-900">Tenants</h3>
                      <div className="mt-3 space-y-4">
                        {tenancyData.tenants.map((tenant: any, index: number) => (
                          <div key={index} className="rounded-md border border-gray-200 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Tenant {index + 1}
                            </h4>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-6">
                              <div className="sm:col-span-3">
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenant.firstName} {tenant.lastName}</dd>
                              </div>
                              <div className="sm:col-span-3">
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                              </div>
                              {tenant.phoneNumber && (
                                <div className="sm:col-span-3">
                                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                  <dd className="mt-1 text-sm text-gray-900">{tenant.phoneNumber}</dd>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#D9E8FF]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                  >
                    {savedProperties.length > 1 && currentPropertyIndex < savedProperties.length - 1 
                      ? `Continue to Next Property (${currentPropertyIndex + 2}/${savedProperties.length})`
                      : "Continue to Setup"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 sm:p-8">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                    <CheckCircleIcon className="h-16 w-16 text-green-600" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-xl title-font text-gray-900">Tenant Setup Complete</h2>
                  <p className="mt-2 text-center text-sm text-gray-600">
                    You have successfully set up your tenant information. You can now proceed to the next step.
                  </p>
                  
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="rounded-md bg-[#D9E8FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                    >
                      Continue to Next Step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 