"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid, RocketLaunchIcon, ArrowRightIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import { QuestionMarkCircleIcon, PhoneIcon, AcademicCapIcon, HomeIcon, BuildingOfficeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { SelectDropdown } from '../../../../components/ui/select-dropdown';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'complete' },
  { id: '04', name: 'Tenants', href: '/onboarding/tenant/import-options', status: 'complete' },
  { id: '05', name: 'Setup', href: '/onboarding/setup/notifications', status: 'complete' },
];

const completedSteps = [
  { name: 'Account', description: 'Your account has been successfully created.' },
  { name: 'Landlord', description: 'Your landlord profile and tax information have been saved.' },
  { name: 'Property', description: 'Your properties have been added to the system.' },
  { name: 'Tenants', description: 'Your tenants have been registered.' },
  { name: 'Setup', description: 'Your notification preferences have been configured.' },
];

const quickLinks = [
  { name: 'Add More Properties', href: '/properties/add', icon: HomeIcon },
  { name: 'Invite Tenants', href: '/residents/invite', icon: ArrowRightIcon },
  { name: 'Set Up Direct Debits', href: '/financial/setup', icon: ArrowRightIcon },
  { name: 'Upload Documents', href: '/properties/documents', icon: ArrowRightIcon },
];

const pricingPlans = [
  { 
    id: 'essential', 
    name: 'Essential Plan', 
    price: '£5', 
    priceUnit: '/month',
    description: 'For landlords managing 1-2 properties',
    features: ['Full access to core property management features', 'Mobile app access', 'Issue tracking'],
    limits: '1-2 properties',
    hmoSupport: false,
    recommended: false
  },
  { 
    id: 'standard', 
    name: 'Standard Plan', 
    price: '£10', 
    priceUnit: '/month',
    description: 'For landlords managing 2-10 properties',
    features: ['All Essential features', 'HMO property support', 'Advanced reporting', 'Enhanced tenant portal'],
    limits: '2-10 properties',
    hmoSupport: true,
    recommended: false
  },
  { 
    id: 'professional', 
    name: 'Professional Plan', 
    price: '£20', 
    priceUnit: '/month',
    description: 'For landlords managing 10+ properties',
    features: ['All Standard features', 'Priority support', 'Enhanced analytics', 'Comprehensive financial reporting'],
    limits: '10+ properties',
    hmoSupport: true,
    recommended: false
  }
];

export default function SetupCompletion() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [hasHmo, setHasHmo] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [recommendedPlan, setRecommendedPlan] = useState('');
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  // Load properties from localStorage and determine recommended plan
  useEffect(() => {
    try {
      // Get properties from localStorage
      const savedProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      setProperties(savedProperties);
      
      // Check if any property is HMO
      const hasHmoProperty = savedProperties.some((property: any) => 
        property.isHmo === true || property.propertyType === 'hmo'
      );
      setHasHmo(hasHmoProperty);

      // Determine recommended plan based on property count and HMO status
      let recommendedPlanId = '';
      if (savedProperties.length === 0) {
        // No properties added, show plan selector
        setShowPlanSelector(true);
        recommendedPlanId = 'essential';
      } else if (savedProperties.length <= 2) {
        // 1-2 properties
        recommendedPlanId = hasHmoProperty ? 'standard' : 'essential';
      } else if (savedProperties.length <= 10) {
        // 2-10 properties
        recommendedPlanId = 'standard';
      } else {
        // 10+ properties
        recommendedPlanId = 'professional';
      }
      
      setRecommendedPlan(recommendedPlanId);
      setSelectedPlan(recommendedPlanId);
      
      // Update recommended flag in plans
      pricingPlans.forEach(plan => {
        plan.recommended = plan.id === recommendedPlanId;
      });
      
    } catch (error) {
      console.error("Error loading properties:", error);
      setShowPlanSelector(true);
    }
  }, []);
  
  // Calculate annual price with 20% discount
  const getAnnualPrice = (monthlyPrice: string) => {
    const price = parseFloat(monthlyPrice.replace('£', ''));
    const annualPrice = price * 12 * 0.8; // 20% discount
    return `£${annualPrice}`;
  };

  // Format price display based on billing cycle
  const formatPrice = (plan: any) => {
    if (billingCycle === 'monthly') {
      return (
        <>
          <span className="text-3xl title-font text-gray-900">{plan.price}</span>
          <span className="ml-1 text-sm font-medium text-gray-500">/month</span>
        </>
      );
    } else {
      return (
        <>
          <span className="text-3xl title-font text-gray-900">{getAnnualPrice(plan.price)}</span>
          <span className="ml-1 text-sm font-medium text-gray-500">/year</span>
          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Save 20%
          </span>
        </>
      );
    }
  };
  
  const handleTakeTour = () => {
    // In a real app, this would trigger a product tour
    alert('Starting product tour...');
  };
  
  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    // Save selected plan to localStorage for payment page
    localStorage.setItem('selectedPlanId', planId);
    localStorage.setItem('billingCycle', billingCycle);
  };

  const handleGoToPayment = () => {
    // Save selected plan to localStorage
    localStorage.setItem('selectedPlanId', selectedPlan);
    localStorage.setItem('billingCycle', billingCycle);
    
    // Navigate to payment page
    router.push('/billing/payment');
  };

  // Render single plan card
  const PlanCard = ({ plan }: { plan: any }) => (
    <div className={`flex flex-col border rounded-lg p-6 ${plan.recommended ? 'border-indigo-500 ring-1 ring-[#D9E8FF]/80' : 'border-gray-300'}`}>
      {plan.recommended && (
        <span className="inline-flex items-center rounded-full bg-[#D9E8FF]/10 px-3 py-1.5 text-xs font-medium text-indigo-800 mb-4">
          Recommended based on your properties
        </span>
      )}
      <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      <div className="mt-4 flex items-baseline flex-wrap gap-1">
        {formatPrice(plan)}
      </div>
      <ul role="list" className="mt-6 space-y-3">
        {plan.features.map((feature: string, index: number) => (
          <li key={index} className="flex">
            <CheckIcon className="h-5 w-5 flex-shrink-0 text-indigo-500" aria-hidden="true" />
            <span className="ml-2 text-sm text-gray-500">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
          {plan.limits}
        </span>
        {plan.hmoSupport ? (
          <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            HMO Support
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            No HMO Support
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => handlePlanSelect(plan.id)}
        className={`mt-6 rounded-md px-4 py-3 text-sm font-semibold shadow-sm ${
          selectedPlan === plan.id 
            ? 'bg-[#D9E8FF] text-white hover:bg-[#D9E8FF]/80' 
            : 'bg-white text-gray-900 ring-1 ring-inset ring-[#D9E8FF]/50 hover:bg-[#D9E8FF]/5'
        }`}
      >
        {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
      </button>
    </div>
  );

  // Billing Cycle Toggle
  const handleBillingCycleChange = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle);
    localStorage.setItem('billingCycle', cycle);
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

        <div className="py-8">
          {/* Celebration Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D9E8FF]/10">
              <RocketLaunchIcon className="h-10 w-10 text-gray-900" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl title-font text-gray-900">Setup Complete!</h2>
            <p className="mt-2 text-base text-gray-500">
              Congratulations! You've successfully completed the onboarding process.
            </p>
          </div>

          {/* Setup Progress Summary */}
          <div className="mx-auto max-w-3xl bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Setup Progress Summary</h3>
              <div className="mt-4">
                <ul role="list" className="divide-y divide-gray-100">
                  {completedSteps.map((step) => (
                    <li key={step.name} className="flex items-center gap-x-3 py-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <CheckIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-6 text-gray-900">{step.name}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Account Status and Plan Selection */}
          <div className="mx-auto max-w-3xl bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Account Status</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Your account is now active and ready to use.</p>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
                <span className="ml-3 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Setup Complete
                </span>
              </div>
              
              {properties.length > 0 && (
                <div className="mt-5 border-t border-gray-200 pt-5">
                  <div className="flex items-center">
                    <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Added
                    </span>
                    {hasHmo && (
                      <span className="ml-4 inline-flex items-center rounded-md bg-[#D9E8FF]/5 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-[#D9E8FF]/20">
                        Includes HMO
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-medium text-gray-900">Subscription Plan</h4>
                  
                  {/* Billing Cycle Toggle */}
                  <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleBillingCycleChange('monthly')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        billingCycle === 'monthly' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBillingCycleChange('annual')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        billingCycle === 'annual' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Annual (20% off)
                    </button>
                  </div>
                </div>
                
                {showPlanSelector ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {pricingPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <PlanCard plan={pricingPlans.find(plan => plan.id === recommendedPlan) || pricingPlans[0]} />
                    <button
                      type="button"
                      onClick={() => setShowPlanSelector(true)}
                      className="mt-4 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      View all plans
                    </button>
                  </div>
                )}
                
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {billingCycle === 'annual' ? 'Annual billing selected - 20% discount applied' : '20% discount available on annual billing'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {billingCycle === 'annual' 
                      ? 'Your subscription will be billed annually.' 
                      : 'Save by paying annually instead of monthly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mx-auto max-w-3xl bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Quick Links</h3>
              <div className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {quickLinks.map((link) => (
                    <div key={link.name} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-[#D9E8FF]/80 focus-within:ring-offset-2 hover:border-gray-400">
                      <div className="flex-shrink-0">
                        <link.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <a href={link.href} className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="text-sm font-medium text-gray-900">{link.name}</p>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="mx-auto max-w-3xl bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Support Information</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>If you need any assistance, our support team is here to help.</p>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  <span className="text-sm text-gray-900">+44 (0) 20 1234 5678</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  <a href="/support" className="text-sm text-gray-900 hover:text-gray-700">
                    Visit our Help Center
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button
              type="button"
              onClick={handleTakeTour}
              className="flex-1 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-[#D9E8FF]/50 hover:bg-[#D9E8FF]/5"
            >
              <div className="flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Take a Tour
              </div>
            </button>
            <button
              type="button"
              onClick={handleGoToPayment}
              className="flex-1 rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
            >
              <div className="flex items-center justify-center">
                Go to Payment
                <CreditCardIcon className="h-5 w-5 ml-2" aria-hidden="true" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 