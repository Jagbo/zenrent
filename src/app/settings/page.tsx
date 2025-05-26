"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { SidebarLayout } from "../components/sidebar-layout";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import { WhatsAppBusinessDrawer } from "../components/WhatsAppBusinessDrawer";
import { BankAccountDrawer } from "../components/BankAccountDrawer";
import { AccountingSoftwareDrawer } from "../components/AccountingSoftwareDrawer";
import { useAuth } from "../../lib/auth-provider";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// Plan configuration - this should ideally come from a database or API
// but for now we'll use a configuration object that matches the plan_ids in the database
const PLAN_CONFIG = {
  essential: {
    id: "essential",
    name: "Essential Plan",
    monthlyPrice: 5,
    yearlyPrice: 48,
    features: [
      "Basic property management",
      "Email support",
      "Up to 5 properties",
    ],
  },
  standard: {
    id: "standard", 
    name: "Standard Plan",
    monthlyPrice: 10,
    yearlyPrice: 96,
    features: [
      "Advanced property management",
      "Priority support",
      "Up to 15 properties",
      "Financial reporting",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional Plan",
    monthlyPrice: 20,
    yearlyPrice: 192,
    features: [
      "Enterprise property management",
      "24/7 support",
      "Unlimited properties",
      "Advanced analytics",
      "API access",
    ],
  },
} as const;

// Helper function to get plan details
const getPlanDetails = (planId: string) => {
  return PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG] || {
    id: planId,
    name: planId.charAt(0).toUpperCase() + planId.slice(1) + " Plan",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [],
  };
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Secondary navigation for settings sections
const secondaryNavigation = [
  { name: "Account", href: "#", current: true },
  { name: "Notifications", href: "#", current: false },
  { name: "Billing", href: "#", current: false },
  { name: "Integrations", href: "#", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type TabType = "Account" | "Notifications" | "Billing" | "Integrations";

// Types for user profile data
interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  notification_preferences: {
    email: {
      rent_payment_alerts: boolean;
      rent_arrears_alerts: boolean;
      maintenance_requests: boolean;
      document_updates: boolean;
      compliance_reminders: boolean;
      tenancy_expiry_reminders: boolean;
      financial_summaries: boolean;
    };
    sms: {
      urgent_maintenance_alerts: boolean;
      rent_payment_confirmations: boolean;
      tenant_communication: boolean;
    };
    app: {
      push_notifications: boolean;
      in_app_notifications: boolean;
      sound_notifications: boolean;
      vibration_notifications: boolean;
    };
    schedule: {
      rent_reminder_days: number;
      certificate_expiry_days: number;
    };
  };
  plan_id: string;
  billing_interval: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}

// Form data interfaces
interface PersonalInfoForm {
  first_name: string;
  last_name: string;
  phone: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Account");
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isAccountingDrawerOpen, setIsAccountingDrawerOpen] = useState(false);

  // Data loading states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form states
  const [personalInfoForm, setPersonalInfoForm] = useState<PersonalInfoForm>({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [notificationPreferences, setNotificationPreferences] = useState<UserProfile['notification_preferences'] | null>(null);

  // Saving states
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Load user profile data
  useEffect(() => {
    if (!user || authLoading) return;

    const loadUserProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);

        const response = await fetch('/api/user-profile');
        
        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.status}`);
        }

        const profile: UserProfile = await response.json();
        setUserProfile(profile);

        // Initialize form data
        setPersonalInfoForm({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone: profile.phone || "",
        });

        setNotificationPreferences(profile.notification_preferences);

      } catch (error) {
        console.error('Error loading user profile:', error);
        setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [user, authLoading]);

  // Handle personal info form submission
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      setSavingPersonalInfo(true);

      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalInfoForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update personal information');
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      
      // Show success message (you can add a toast notification here)
      console.log('Personal information updated successfully');

    } catch (error) {
      console.error('Error updating personal information:', error);
      // Show error message (you can add a toast notification here)
    } finally {
      setSavingPersonalInfo(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);

      const response = await fetch('/api/user-profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      // Clear form
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      // Show success message
      console.log('Password updated successfully');

    } catch (error) {
      console.error('Error updating password:', error);
      alert(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle notification preferences update
  const handleNotificationUpdate = async (newPreferences: UserProfile['notification_preferences']) => {
    if (!userProfile) return;

    try {
      setSavingNotifications(true);

      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_preferences: newPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setNotificationPreferences(newPreferences);

      console.log('Notification preferences updated successfully');

    } catch (error) {
      console.error('Error updating notification preferences:', error);
    } finally {
      setSavingNotifications(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/user-profile/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePlanChange = async (
    newPlan: string,
    interval: "monthly" | "yearly",
  ) => {
    setIsLoading(true);
    try {
      // Call your API to create a Stripe Checkout Session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: newPlan,
          interval: interval,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      // Redirect to Stripe Checkout
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error("Error:", error);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsChangePlanModalOpen(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // Call your API to cancel the subscription
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
      });

      if (response.ok) {
        // Handle successful cancellation
        // You might want to update the UI or show a success message
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Error loading settings: {profileError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <h1 className="sr-only">Account Settings</h1>

      {/* Settings forms */}
      <div className="space-y-6">
        {/* Secondary navigation */}
        <nav className="flex overflow-x-auto py-3 bg-white" data-component-name="Settings">
          <ul role="list"
            className="flex min-w-full flex-none gap-x-6 px-4 sm:px-8 lg:px-8 text-sm/6 font-semibold text-gray-500"
          >
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <button onClick={() => setActiveTab(item.name as TabType)}
                  className={activeTab === item.name ? "text-gray-900" : ""}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {activeTab === "Account" && (
          <div className="divide-y divide-gray-200">
            {/* Personal Information Section */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Update your personal details and contact information.
                </p>
              </div>

              <form className="md:col-span-2" onSubmit={handlePersonalInfoSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="first-name"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      First name
                    </label>
                    <div className="mt-2">
                      <input 
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        value={personalInfoForm.first_name}
                        onChange={(e) => setPersonalInfoForm(prev => ({
                          ...prev,
                          first_name: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 px-3 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6" data-component-name="Settings"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="last-name"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Last name
                    </label>
                    <div className="mt-2">
                      <input 
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        value={personalInfoForm.last_name}
                        onChange={(e) => setPersonalInfoForm(prev => ({
                          ...prev,
                          last_name: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 px-3 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6" data-component-name="Settings"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="email"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Email address
                    </label>
                    <div className="mt-2">
                      <input 
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={user?.email || ""}
                        disabled
                        className="block w-full rounded-md border-0 py-1.5 bg-gray-50 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm/6"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed from this page. Contact support if you need to update your email.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="phone"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Phone number
                    </label>
                    <div className="mt-2">
                      <input 
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={personalInfoForm.phone}
                        onChange={(e) => setPersonalInfoForm(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 px-3 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6" data-component-name="Settings"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button 
                    type="submit"
                    disabled={savingPersonalInfo}
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-[#D9E8FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-50"
                  >
                    {savingPersonalInfo ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Section */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Change password
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Update your password associated with your account.
                </p>
              </div>

              <form className="md:col-span-2" onSubmit={handlePasswordSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label htmlFor="current-password"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Current password
                    </label>
                    <div className="mt-2">
                      <input 
                        id="current-password"
                        name="current_password"
                        type="password"
                        autoComplete="current-password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          current_password: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="new-password"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      New password
                    </label>
                    <div className="mt-2">
                      <input 
                        id="new-password"
                        name="new_password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          new_password: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="confirm-password"
                      className="block text-sm/6 font-medium text-gray-900"
                    >
                      Confirm password
                    </label>
                    <div className="mt-2">
                      <input 
                        id="confirm-password"
                        name="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          confirm_password: e.target.value
                        }))}
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button 
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-[#D9E8FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-50"
                  >
                    {savingPassword ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>

            {/* Log out section */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Log out
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  No longer want to use our service? You can log out here.
                </p>
              </div>

              <div className="flex items-start md:col-span-2">
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400"
                >
                  Yes, log out
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="divide-y divide-gray-200">
            {!notificationPreferences ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading notification preferences...</p>
                </div>
              </div>
            ) : (
              <>
            {/* Email Notifications */}
            {/* Email Notifications */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Email Notifications
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Choose what email notifications you want to receive.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  {Object.entries(notificationPreferences.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPreferences = {
                            ...notificationPreferences,
                            email: {
                              ...notificationPreferences.email,
                              [key]: !value
                            }
                          };
                          handleNotificationUpdate(newPreferences);
                        }}
                        className={classNames(
                          value ? 'bg-[#4F83CC]' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F83CC] focus:ring-offset-2'
                        )}
                      >
                        <span
                          className={classNames(
                            value ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  SMS Notifications
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Choose what SMS notifications you want to receive.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  {Object.entries(notificationPreferences.sms).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPreferences = {
                            ...notificationPreferences,
                            sms: {
                              ...notificationPreferences.sms,
                              [key]: !value
                            }
                          };
                          handleNotificationUpdate(newPreferences);
                        }}
                        className={classNames(
                          value ? 'bg-[#4F83CC]' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F83CC] focus:ring-offset-2'
                        )}
                      >
                        <span
                          className={classNames(
                            value ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* App Notifications */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Mobile App Notifications
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Choose what mobile app notifications you want to receive.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  {Object.entries(notificationPreferences.app).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPreferences = {
                            ...notificationPreferences,
                            app: {
                              ...notificationPreferences.app,
                              [key]: !value
                            }
                          };
                          handleNotificationUpdate(newPreferences);
                        }}
                        className={classNames(
                          value ? 'bg-[#4F83CC]' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F83CC] focus:ring-offset-2'
                        )}
                      >
                        <span
                          className={classNames(
                            value ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Schedule */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Notification Schedule
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Configure when you want to receive certain notifications.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="rent-reminder-days" className="block text-sm font-medium text-gray-900">
                      Rent reminder (days before due)
                    </label>
                    <div className="mt-2">
                      <input
                        type="number"
                        id="rent-reminder-days"
                        min="1"
                        max="30"
                        value={notificationPreferences?.schedule?.rent_reminder_days || 7}
                        onChange={(e) => {
                          if (!notificationPreferences) return;
                          const newPreferences = {
                            ...notificationPreferences,
                            schedule: {
                              ...notificationPreferences.schedule,
                              rent_reminder_days: parseInt(e.target.value)
                            }
                          };
                          handleNotificationUpdate(newPreferences);
                        }}
                        className="block w-20 rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm bg-white" data-component-name="Settings"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="certificate-expiry-days" className="block text-sm font-medium text-gray-900">
                      Certificate expiry reminder (days before expiry)
                    </label>
                    <div className="mt-2">
                      <input
                        type="number"
                        id="certificate-expiry-days"
                        min="1"
                        max="90"
                        value={notificationPreferences?.schedule?.certificate_expiry_days || 30}
                        onChange={(e) => {
                          if (!notificationPreferences) return;
                          const newPreferences = {
                            ...notificationPreferences,
                            schedule: {
                              ...notificationPreferences.schedule,
                              certificate_expiry_days: parseInt(e.target.value)
                            }
                          };
                          handleNotificationUpdate(newPreferences);
                        }}
                        className="block w-20 rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm bg-white" data-component-name="Settings"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === "Billing" && userProfile && (
          <div className="divide-y divide-gray-200">
            {/* Current Plan */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Current Plan
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Manage your subscription and billing preferences.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {getPlanDetails(userProfile.plan_id).name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {userProfile.billing_interval === 'monthly' ? 'Monthly' : 'Yearly'} billing
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className={classNames(
                          userProfile.subscription_status === 'active' ? 'text-green-600' :
                          userProfile.subscription_status === 'cancelled' ? 'text-red-600' :
                          userProfile.subscription_status === 'past_due' ? 'text-yellow-600' :
                          'text-gray-600',
                          'font-medium'
                        )}>
                          {userProfile.subscription_status.charAt(0).toUpperCase() + userProfile.subscription_status.slice(1)}
                        </span>
                      </p>
                      {userProfile.next_billing_date && (
                        <p className="text-sm text-gray-500">
                          Next billing: {formatDate(userProfile.next_billing_date)}
                        </p>
                      )}
                    </div>
                                          <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            userProfile.billing_interval === 'monthly' 
                              ? getPlanDetails(userProfile.plan_id).monthlyPrice 
                              : getPlanDetails(userProfile.plan_id).yearlyPrice
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          per {userProfile.billing_interval === 'monthly' ? 'month' : 'year'}
                        </p>
                      </div>
                  </div>

                  {/* Plan Features */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Plan Features</h4>
                    <ul className="space-y-2">
                      {getPlanDetails(userProfile.plan_id).features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsChangePlanModalOpen(true)}
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-[#D9E8FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                    >
                      Change Plan
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50" data-component-name="Settings"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Integrations" && (
          <div className="divide-y divide-gray-200">

            {/* Communication & Calendar */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Communication & Calendar
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Connect communication tools and calendar services.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white" data-component-name="Settings">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-red-600">G</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Google Calendar</h3>
                        <p className="text-sm text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50" data-component-name="Settings"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white" data-component-name="Settings">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">W</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">WhatsApp Business</h3>
                        <p className="text-sm text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppDrawerOpen(true)}
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50" data-component-name="Settings"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white" data-component-name="Settings">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">O</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Outlook Calendar</h3>
                        <p className="text-sm text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50" data-component-name="Settings"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Banking */}
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Banking
                </h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Connect your bank accounts for automatic transaction sync.
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white" data-component-name="Settings">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">OB</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Open Banking</h3>
                        <p className="text-sm text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBankAccountDrawerOpen(true)}
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50" data-component-name="Settings"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      <Dialog open={isChangePlanModalOpen} onClose={setIsChangePlanModalOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold text-gray-900">
                    Change Plan
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Select a new plan for your account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan selection would go here - simplified for now */}
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangePlanModalOpen(false)}
                  className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanChange("standard", userProfile?.billing_interval as "monthly" | "yearly" || "monthly")}
                  disabled={isLoading}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Confirm Change'}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Integration Drawers */}
      <WhatsAppBusinessDrawer
        isOpen={isWhatsAppDrawerOpen}
        onClose={() => setIsWhatsAppDrawerOpen(false)}
      />
      <BankAccountDrawer
        isOpen={isBankAccountDrawerOpen}
        onClose={() => setIsBankAccountDrawerOpen(false)}
      />
      <AccountingSoftwareDrawer
        isOpen={isAccountingDrawerOpen}
        onClose={() => setIsAccountingDrawerOpen(false)}
      />
    </SidebarLayout>
  );
}
