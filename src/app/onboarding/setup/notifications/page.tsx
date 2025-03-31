"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { SelectDropdown } from '../../../../components/ui/select-dropdown';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'complete' },
  { id: '04', name: 'Tenants', href: '/onboarding/tenant/import-options', status: 'complete' },
  { id: '05', name: 'Setup', href: '/onboarding/setup/notifications', status: 'current' },
];

export default function NotificationPreferences() {
  const router = useRouter();
  
  // State for user ID and loading/error states
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Email notification states
  const [emailRentPayments, setEmailRentPayments] = useState(true);
  const [emailRentArrears, setEmailRentArrears] = useState(true);
  const [emailMaintenance, setEmailMaintenance] = useState(true);
  const [emailDocuments, setEmailDocuments] = useState(true);
  const [emailCompliance, setEmailCompliance] = useState(true);
  const [emailTenancyExpiry, setEmailTenancyExpiry] = useState(true);
  const [emailFinancialSummaries, setEmailFinancialSummaries] = useState(true);
  
  // SMS notification states
  const [smsUrgentMaintenance, setSmsUrgentMaintenance] = useState(false);
  const [smsRentPayments, setSmsRentPayments] = useState(false);
  const [smsTenantCommunication, setSmsTenantCommunication] = useState(false);
  
  // Mobile app notification states
  const [appNotifications, setAppNotifications] = useState(true);
  
  // Fetch user and notification preferences
  useEffect(() => {
    async function fetchUserAndPreferences() {
      setIsLoading(true);
      
      try {
        // In development, use test user ID
        if (process.env.NODE_ENV === 'development') {
          const devUserId = localStorage.getItem('devUserId') || '00000000-0000-0000-0000-000000000001';
          setUserId(devUserId);
          localStorage.setItem('devUserId', devUserId);
          
          // Fetch notification preferences for test user
          const { data, error } = await supabase.rpc(
            'get_user_notification_preferences',
            { p_user_id: devUserId }
          );
          
          if (error) {
            console.error('Error fetching preferences:', error);
          } else if (data) {
            // Set state from fetched preferences
            updatePreferencesState(data);
          }
          
          setIsLoading(false);
          return;
        }
        
        // In production, fetch actual user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (user) {
          setUserId(user.id);
          
          // Fetch notification preferences
          const { data, error } = await supabase.rpc(
            'get_user_notification_preferences', 
            { p_user_id: user.id }
          );
          
          if (error) {
            console.error('Error fetching preferences:', error);
          } else if (data) {
            // Set state from fetched preferences
            updatePreferencesState(data);
          }
        } else {
          // If no user is found, redirect to login
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to fetch user information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserAndPreferences();
  }, [router]);
  
  // Helper function to update all state values from fetched preferences
  const updatePreferencesState = (preferences: any) => {
    // Email preferences
    if (preferences.email) {
      setEmailRentPayments(preferences.email.rentPayments ?? true);
      setEmailRentArrears(preferences.email.rentArrears ?? true);
      setEmailMaintenance(preferences.email.maintenance ?? true);
      setEmailDocuments(preferences.email.documents ?? true);
      setEmailCompliance(preferences.email.compliance ?? true);
      setEmailTenancyExpiry(preferences.email.tenancyExpiry ?? true);
      setEmailFinancialSummaries(preferences.email.financialSummaries ?? true);
    }
    
    // SMS preferences
    if (preferences.sms) {
      setSmsUrgentMaintenance(preferences.sms.urgentMaintenance ?? false);
      setSmsRentPayments(preferences.sms.rentPayments ?? false);
      setSmsTenantCommunication(preferences.sms.tenantCommunication ?? false);
    }
    
    // App preferences
    if (preferences.app) {
      setAppNotifications(preferences.app.enabled ?? true);
    }
  };
  
  // Helper function to build preferences object from state
  const buildPreferencesObject = () => {
    return {
      email: {
        rentPayments: emailRentPayments,
        rentArrears: emailRentArrears,
        maintenance: emailMaintenance,
        documents: emailDocuments,
        compliance: emailCompliance,
        tenancyExpiry: emailTenancyExpiry,
        financialSummaries: emailFinancialSummaries,
      },
      sms: {
        urgentMaintenance: smsUrgentMaintenance,
        rentPayments: smsRentPayments,
        tenantCommunication: smsTenantCommunication,
      },
      app: {
        enabled: appNotifications,
      }
    };
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Build notification preferences object
      const notificationPreferences = buildPreferencesObject();
      
      // Update preferences in Supabase
      const { data, error: updateError } = await supabase.rpc(
        'update_user_notification_preferences',
        {
          p_user_id: userId,
          p_preferences: notificationPreferences
        }
      );
      
      if (updateError) {
        throw updateError;
      }
      
      // Update onboarding progress
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          setup_completed: true,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        // Log but don't fail the submission
        console.error('Error updating setup completion status:', profileError);
      }
      
      // Navigate to the completion page
      router.push('/onboarding/setup/completion');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError('Failed to save notification preferences. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Build notification preferences object
      const notificationPreferences = buildPreferencesObject();
      
      // Save to localStorage as backup
      localStorage.setItem('notificationPreferencesDraft', JSON.stringify(notificationPreferences));
      
      // Update preferences in Supabase
      const { data, error: updateError } = await supabase.rpc(
        'update_user_notification_preferences',
        {
          p_user_id: userId,
          p_preferences: notificationPreferences
        }
      );
      
      if (updateError) {
        throw updateError;
      }
      
      // Navigate to next step
      router.push('/onboarding/setup/completion');
    } catch (error) {
      console.error("Error saving notification preferences draft:", error);
      setError('Failed to save draft. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => {
    return (
      <button
        type="button"
        className={`${
          enabled ? 'bg-[#D9E8FF]' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <SidebarLayout 
        sidebar={<SideboardOnboardingContent />}
        isOnboarding={true}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D9E8FF]"></div>
        </div>
      </SidebarLayout>
    );
  }

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
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]">
                          <CheckIconSolid aria-hidden="true" className="size-4 sm:size-6 text-gray-900" />
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
            <h2 className="text-base/7 title-font text-gray-900">Notification Preferences</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Customize how and when you receive alerts about important property management events.
            </p>
            
            {/* Display error if any */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <form className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2" onSubmit={handleSubmit}>
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Email Notifications */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Email Notifications
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600 mb-4">
                    Select which notifications you'd like to receive via email.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-rent-payments" className="text-sm font-medium text-gray-900">
                        Rent payment alerts
                      </label>
                      <ToggleSwitch enabled={emailRentPayments} onChange={() => setEmailRentPayments(!emailRentPayments)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-rent-arrears" className="text-sm font-medium text-gray-900">
                        Rent arrears alerts
                      </label>
                      <ToggleSwitch enabled={emailRentArrears} onChange={() => setEmailRentArrears(!emailRentArrears)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-maintenance" className="text-sm font-medium text-gray-900">
                        Maintenance requests
                      </label>
                      <ToggleSwitch enabled={emailMaintenance} onChange={() => setEmailMaintenance(!emailMaintenance)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-documents" className="text-sm font-medium text-gray-900">
                        Document updates
                      </label>
                      <ToggleSwitch enabled={emailDocuments} onChange={() => setEmailDocuments(!emailDocuments)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-compliance" className="text-sm font-medium text-gray-900">
                        Compliance reminders
                      </label>
                      <ToggleSwitch enabled={emailCompliance} onChange={() => setEmailCompliance(!emailCompliance)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-tenancy-expiry" className="text-sm font-medium text-gray-900">
                        Tenancy expiry reminders
                      </label>
                      <ToggleSwitch enabled={emailTenancyExpiry} onChange={() => setEmailTenancyExpiry(!emailTenancyExpiry)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-financial-summaries" className="text-sm font-medium text-gray-900">
                        Financial reports and summaries
                      </label>
                      <ToggleSwitch enabled={emailFinancialSummaries} onChange={() => setEmailFinancialSummaries(!emailFinancialSummaries)} />
                    </div>
                  </div>
                </div>
                
                {/* SMS Notifications */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 title-font text-gray-900 flex items-center">
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-gray-500" />
                    SMS Notifications
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600 mb-4">
                    Select which notifications you'd like to receive via SMS. These are typically reserved for high-priority or urgent matters.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-urgent-maintenance" className="text-sm font-medium text-gray-900">
                        Urgent maintenance issues
                      </label>
                      <ToggleSwitch enabled={smsUrgentMaintenance} onChange={() => setSmsUrgentMaintenance(!smsUrgentMaintenance)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-rent-payments" className="text-sm font-medium text-gray-900">
                        Rent payment confirmations
                      </label>
                      <ToggleSwitch enabled={smsRentPayments} onChange={() => setSmsRentPayments(!smsRentPayments)} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-tenant-communication" className="text-sm font-medium text-gray-900">
                        Tenant communication alerts
                      </label>
                      <ToggleSwitch enabled={smsTenantCommunication} onChange={() => setSmsTenantCommunication(!smsTenantCommunication)} />
                    </div>
                  </div>
                </div>
                
                {/* Mobile App Notifications */}
                <div>
                  <h2 className="text-base/7 title-font text-gray-900 flex items-center">
                    <BellIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Mobile App Notifications
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600 mb-4">
                    Enable push notifications on the mobile app.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="app-notifications" className="text-sm font-medium text-gray-900">
                        Enable push notifications
                      </label>
                      <ToggleSwitch enabled={appNotifications} onChange={() => setAppNotifications(!appNotifications)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="text-sm font-semibold leading-6 text-gray-900 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save as draft'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 