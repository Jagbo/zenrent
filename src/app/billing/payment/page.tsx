"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../components/sideboard-onboarding-content';
import { CheckIcon, CreditCardIcon, LockClosedIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// Types for subscription plans
interface Plan {
  id: string;
  name: string;
  price: string;
  interval: 'month' | 'year';
  features: string[];
  limits: string;
  hmoSupport: boolean;
}

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Billing details
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  // Payment details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  // Billing address
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: 'GB'
  });

  // Load selected plan from localStorage
  useEffect(() => {
    try {
      // Get selected plan info from localStorage
      const planId = localStorage.getItem('selectedPlanId') || 'essential';
      const cycle = localStorage.getItem('billingCycle') || 'monthly';
      setBillingCycle(cycle as 'monthly' | 'annual');
      
      const plans: Record<string, Plan> = {
        essential: {
          id: 'essential',
          name: 'Essential Plan',
          price: cycle === 'monthly' ? '£5' : '£48',
          interval: cycle === 'monthly' ? 'month' : 'year',
          features: ['Full access to core property management features', 'Mobile app access', 'Issue tracking'],
          limits: '1-2 properties',
          hmoSupport: false
        },
        standard: {
          id: 'standard',
          name: 'Standard Plan',
          price: cycle === 'monthly' ? '£10' : '£96',
          interval: cycle === 'monthly' ? 'month' : 'year',
          features: ['All Essential features', 'HMO property support', 'Advanced reporting', 'Enhanced tenant portal'],
          limits: '2-10 properties',
          hmoSupport: true
        },
        professional: {
          id: 'professional',
          name: 'Professional Plan',
          price: cycle === 'monthly' ? '£20' : '£192',
          interval: cycle === 'monthly' ? 'month' : 'year',
          features: ['All Standard features', 'Priority support', 'Enhanced analytics', 'Comprehensive financial reporting'],
          limits: '10+ properties',
          hmoSupport: true
        }
      };
      
      setSelectedPlan(plans[planId]);
    } catch (error) {
      console.error("Error loading plan data:", error);
      // Default to Essential Plan if there's an error
      setSelectedPlan({
        id: 'essential',
        name: 'Essential Plan',
        price: '£5',
        interval: 'month',
        features: ['Full access to core property management features', 'Mobile app access', 'Issue tracking'],
        limits: '1-2 properties',
        hmoSupport: false
      });
    }
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would integrate with Stripe's API to:
      // 1. Create a Payment Method from the card details
      // 2. Create a Customer if it doesn't exist
      // 3. Create a Subscription for the customer with the selected plan
      
      // For now, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      setPaymentSuccess(true);
      
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/onboarding/setup/completion');
  };

  return (
    <SidebarLayout 
      sidebar={<SideboardOnboardingContent />}
      isOnboarding={true}
    >
      <div className="py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              type="button"
              onClick={handleGoBack}
              className="mr-4 rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="text-2xl title-font text-gray-900">Subscription Payment</h1>
          </div>

          {paymentSuccess ? (
            <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg title-font text-gray-900">Payment Successful</h2>
              <p className="mt-2 text-sm text-gray-500">
                Thank you for your subscription! You will be redirected to your dashboard shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-5">
              {/* Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-300 shadow-sm rounded-lg divide-y divide-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 rounded-t-lg">
                    <h2 className="text-lg title-font text-gray-900">Order Summary</h2>
                  </div>
                  <div className="p-6">
                    {selectedPlan && (
                      <div className="mt-4">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <p>{selectedPlan.name}</p>
                          <p>{selectedPlan.price}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Billing {selectedPlan.interval === 'month' ? 'monthly' : 'annually'} 
                          {selectedPlan.interval === 'year' && " (20% discount applied)"}
                        </p>
                        
                        <ul className="mt-4 space-y-2">
                          {selectedPlan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
                              <span className="ml-2 text-sm text-gray-500">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 whitespace-nowrap">
                            {selectedPlan.limits}
                          </span>
                          {selectedPlan.hmoSupport ? (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 whitespace-nowrap">
                              HMO Support
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 whitespace-nowrap">
                              No HMO Support
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Total</p>
                      <p>{selectedPlan?.price || '£0'}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      Secure Payment
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Your payment information is encrypted and secure. We use Stripe for secure payment processing.
                  </p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="lg:col-span-3">
                <div className="bg-white border border-gray-300 shadow-sm rounded-lg divide-y divide-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 rounded-t-lg">
                    <h2 className="text-lg title-font text-gray-900">Payment Details</h2>
                  </div>
                  <div className="p-6">
                    {error && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            {/* Error icon */}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>{error}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        {/* Card Information */}
                        <div>
                          <h3 className="text-sm title-font text-gray-900 mb-4">Card Information</h3>
                          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                            <div className="sm:col-span-2">
                              <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">
                                Card number
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="card-number"
                                  name="card-number"
                                  placeholder="1234 5678 9012 3456"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                  maxLength={19}
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700">
                                Expiration date (MM/YY)
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="expiration-date"
                                  name="expiration-date"
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                  maxLength={5}
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                                CVC
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="cvc"
                                  name="cvc"
                                  placeholder="123"
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                  maxLength={3}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">
                                Name on card
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="card-name"
                                  name="card-name"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Billing Address */}
                        <div>
                          <h3 className="text-sm title-font text-gray-900 mb-4">Billing Address</h3>
                          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                            <div className="sm:col-span-2">
                              <label htmlFor="address-line1" className="block text-sm font-medium text-gray-700">
                                Address line 1
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="address-line1"
                                  name="address-line1"
                                  value={billingAddress.line1}
                                  onChange={(e) => setBillingAddress({...billingAddress, line1: e.target.value})}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="address-line2" className="block text-sm font-medium text-gray-700">
                                Address line 2 (optional)
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="address-line2"
                                  name="address-line2"
                                  value={billingAddress.line2}
                                  onChange={(e) => setBillingAddress({...billingAddress, line2: e.target.value})}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City / Town
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="city"
                                  name="city"
                                  value={billingAddress.city}
                                  onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                                Postcode
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="postcode"
                                  name="postcode"
                                  value={billingAddress.postcode}
                                  onChange={(e) => setBillingAddress({...billingAddress, postcode: e.target.value})}
                                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-d9e8ff-80 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <button
                          type="submit"
                          disabled={loading}
                          className={`w-full rounded-md px-4 py-3 text-base font-medium text-gray-900 ${
                            loading 
                              ? 'bg-gray-200 cursor-not-allowed' 
                              : 'bg-[#D9E8FF]'
                          }`}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <CreditCardIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                              Pay {selectedPlan?.price || '£0'}
                            </span>
                          )}
                        </button>
                        <p className="mt-2 text-center text-xs text-gray-500">
                          By confirming your subscription, you allow ZenRent to charge your card for this payment and future payments in accordance with our terms.
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
} 