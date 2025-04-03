'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/20/solid'
import { SidebarLayout } from '../components/sidebar-layout'
import { SidebarContent } from '../components/sidebar-content'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'
import { WhatsAppBusinessDrawer } from '../components/WhatsAppBusinessDrawer'
import { BankAccountDrawer } from '../components/BankAccountDrawer'
import { AccountingSoftwareDrawer } from '../components/AccountingSoftwareDrawer'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const plans = {
  essential: {
    name: 'Essential Plan',
    monthlyPrice: 5,
    yearlyPrice: 48,
    features: ['Basic property management', 'Email support', 'Up to 5 properties'],
  },
  standard: {
    name: 'Standard Plan',
    monthlyPrice: 10,
    yearlyPrice: 96,
    features: ['Advanced property management', 'Priority support', 'Up to 15 properties', 'Financial reporting'],
  },
  professional: {
    name: 'Professional Plan',
    monthlyPrice: 20,
    yearlyPrice: 192,
    features: ['Enterprise property management', '24/7 support', 'Unlimited properties', 'Advanced analytics', 'API access'],
  },
}

// Secondary navigation for settings sections
const secondaryNavigation = [
  { name: 'Account', href: '#', current: true },
  { name: 'Notifications', href: '#', current: false },
  { name: 'Billing', href: '#', current: false },
  { name: 'Integrations', href: '#', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type TabType = 'Account' | 'Notifications' | 'Billing' | 'Integrations';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('Account')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'standard' | 'professional'>('standard')
  const [isLoading, setIsLoading] = useState(false)
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false)
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false)
  const [isAccountingDrawerOpen, setIsAccountingDrawerOpen] = useState(false)

  const handlePlanChange = async (newPlan: string, interval: 'monthly' | 'yearly') => {
    setIsLoading(true)
    try {
      // Call your API to create a Stripe Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: newPlan,
          interval: interval,
        }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      // Redirect to Stripe Checkout
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Error:', error)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      setIsChangePlanModalOpen(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      // Call your API to cancel the subscription
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      })

      if (response.ok) {
        // Handle successful cancellation
        // You might want to update the UI or show a success message
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/settings" />}
    >
      <h1 className="sr-only">Account Settings</h1>

      <header className="border-b border-gray-200">
        {/* Secondary navigation */}
        <nav className="flex overflow-x-auto py-3">
          <ul
            role="list"
            className="flex min-w-full flex-none gap-x-6 px-4 sm:px-8 lg:px-8 text-sm/6 font-semibold text-gray-500"
          >
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => setActiveTab(item.name as TabType)}
                  className={activeTab === item.name ? 'text-gray-900' : ''}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Settings forms */}
      <div className="space-y-6">
        {activeTab === 'Account' && (
          <div className="divide-y divide-gray-200">
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Personal Information</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Use a permanent address where you can receive mail.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full flex items-center gap-x-8">
                    <img
                      alt=""
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="size-24 flex-none rounded-lg bg-gray-100 object-cover"
                    />
                    <div>
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Change avatar
                      </button>
                      <p className="mt-2 text-xs/5 text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                      First name
                    </label>
                    <div className="mt-2">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                      Last name
                    </label>
                    <div className="mt-2">
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="timezone" className="block text-sm/6 font-medium text-gray-900">
                      Timezone
                    </label>
                    <div className="mt-2 relative">
                      <select
                        id="timezone"
                        name="timezone"
                        className="block w-full rounded-md border-0 py-1.5 bg-white pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      >
                        <option>Pacific Standard Time</option>
                        <option>Eastern Standard Time</option>
                        <option>Greenwich Mean Time</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button
                    type="submit"
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Change password</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Update your password associated with your account.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label htmlFor="current-password" className="block text-sm/6 font-medium text-gray-900">
                      Current password
                    </label>
                    <div className="mt-2">
                      <input
                        id="current-password"
                        name="current_password"
                        type="password"
                        autoComplete="current-password"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="new-password" className="block text-sm/6 font-medium text-gray-900">
                      New password
                    </label>
                    <div className="mt-2">
                      <input
                        id="new-password"
                        name="new_password"
                        type="password"
                        autoComplete="new-password"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="confirm-password" className="block text-sm/6 font-medium text-gray-900">
                      Confirm password
                    </label>
                    <div className="mt-2">
                      <input
                        id="confirm-password"
                        name="confirm_password"
                        type="password"
                        autoComplete="new-password"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button
                    type="submit"
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Log out other sessions</h2>
                <p className="mt-1 text-sm/6 text-gray-500">
                  Please enter your password to confirm you would like to log out of your other sessions across all of
                  your devices.
                </p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label htmlFor="logout-password" className="block text-sm/6 font-medium text-gray-900">
                      Password
                    </label>
                    <div className="mt-2">
                      <input
                        id="logout-password"
                        name="logout_password"
                        type="password"
                        className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button
                    type="submit"
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                  >
                    Log out other sessions
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <div className="divide-y divide-gray-200">
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Email Notifications</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Select which email notifications you'd like to receive.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Rent payment alerts</h3>
                        <p className="text-sm text-gray-500">Receive notifications when rent payments are received</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable rent payment alerts</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Rent arrears alerts</h3>
                        <p className="text-sm text-gray-500">Receive notifications about overdue rent payments</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable rent arrears alerts</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Maintenance requests</h3>
                        <p className="text-sm text-gray-500">Get notified about new and updated maintenance requests</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable maintenance request notifications</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Document updates</h3>
                        <p className="text-sm text-gray-500">Notifications when documents are added or updated</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable document update notifications</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Compliance reminders</h3>
                        <p className="text-sm text-gray-500">Reminders about upcoming compliance requirements</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable compliance reminder notifications</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Tenancy expiry reminders</h3>
                        <p className="text-sm text-gray-500">Notifications about upcoming tenancy expiration dates</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable tenancy expiry reminders</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Financial summaries</h3>
                        <p className="text-sm text-gray-500">Regular financial reports and summaries</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable financial summary notifications</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">SMS Notifications</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Select which notifications you'd like to receive by SMS.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Urgent maintenance alerts</h3>
                        <p className="text-sm text-gray-500">SMS notifications for critical maintenance issues</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable urgent maintenance SMS alerts</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Rent payment confirmations</h3>
                        <p className="text-sm text-gray-500">SMS confirmations when rent payments are processed</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable rent payment SMS confirmations</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Tenant communication</h3>
                        <p className="text-sm text-gray-500">SMS notifications for tenant messages and communication</p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                      >
                        <span className="sr-only">Enable tenant communication SMS alerts</span>
                        <span
                          className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Mobile App Notifications</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Configure push notifications for the mobile app.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900">All notification types with granular control</h3>
                        <p className="text-sm text-gray-500">Configure individual push notification settings in the mobile app</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                        >
                          Open Mobile App
                        </button>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm text-gray-500">Enable push notifications</span>
                          <button
                            type="button"
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#D9E8FF] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2"
                          >
                            <span className="sr-only">Enable push notifications</span>
                            <span
                              className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Notification Schedule</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Configure when reminders should be sent.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                  <div className="col-span-full">
                    <label htmlFor="rent-reminder-days" className="block text-sm/6 font-medium text-gray-900">
                      Rent reminder days
                    </label>
                    <p className="text-sm text-gray-500 mb-2">Days before rent due date to send reminders</p>
                    <div className="mt-2">
                      <input
                        type="number"
                        name="rent-reminder-days"
                        id="rent-reminder-days"
                        min="1"
                        max="30"
                        defaultValue="7"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="certificate-expiry-days" className="block text-sm/6 font-medium text-gray-900">
                      Certificate expiry reminder days
                    </label>
                    <p className="text-sm text-gray-500 mb-2">Days before certificate expiry to send reminders</p>
                    <div className="mt-2">
                      <input
                        type="number"
                        name="certificate-expiry-days"
                        id="certificate-expiry-days"
                        min="1"
                        max="90"
                        defaultValue="30"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D9E8FF] sm:text-sm/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex">
                  <button
                    type="submit"
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                  >
                    Save preferences
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'Billing' && (
          <div className="divide-y divide-gray-200">
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 sm:py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Current Subscription</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Manage your subscription plan and billing cycle.</p>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{plans[selectedPlan].name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        £{billingInterval === 'monthly' ? plans[selectedPlan].monthlyPrice : plans[selectedPlan].yearlyPrice} / {billingInterval}
                        {billingInterval === 'yearly' && (
                          <span className="ml-2 text-green-600">(20% off)</span>
                        )}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Plan includes:</h4>
                    <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      {plans[selectedPlan].features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-gray-500">
                          <svg className="mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-sm text-gray-500">Next billing date: <span className="font-medium text-gray-900">Feb 1, 2024</span></p>
                    </div>
                    <div className="mt-4 flex space-x-3 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => setIsChangePlanModalOpen(true)}
                        disabled={isLoading}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Change plan'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isLoading}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Cancel subscription'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 sm:py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Payment Method</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Manage your payment information and billing history.</p>
              </div>

              <form className="md:col-span-2">
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:max-w-xl">
                  <div className="col-span-full">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                      <div className="flex items-center space-x-4">
                        <div className="h-8 w-12 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-500">VISA</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/24</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-gray-900 hover:text-gray-700"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Billing History</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Premium Plan</p>
                          <p className="text-sm text-gray-500">Monthly subscription</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">$29.99</p>
                          <p className="text-sm text-gray-500">Last billed on Jan 1, 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Premium Plan</p>
                          <p className="text-sm text-gray-500">Monthly subscription</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">$29.99</p>
                          <p className="text-sm text-gray-500">Last billed on Dec 1, 2023</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Download invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'Integrations' && (
          <div className="divide-y divide-gray-200">
            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Accounting & Finance</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Connect with accounting software.</p>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#2CA01C] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/quickbooks.png"
                          alt="QuickBooks logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">QuickBooks</p>
                        <p className="text-sm text-gray-500">Sync financial data and transaction history</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 mr-3 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Connected
                      </span>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#13B5EA] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/Xero.png"
                          alt="Xero logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Xero</p>
                        <p className="text-sm text-gray-500">Accounting software integration</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                      onClick={() => setIsAccountingDrawerOpen(true)}
                    >
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#00D639] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/sage.png"
                          alt="Sage logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sage</p>
                        <p className="text-sm text-gray-500">Business management and accounting</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Communication & Calendar</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Connect communication and calendar tools.</p>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#4285F4] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/google-calendar.png"
                          alt="Google Calendar logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                        <p className="text-sm text-gray-500">Sync property viewings and appointments</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 mr-3 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Connected
                      </span>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#25D366] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/whatsapp.png"
                          alt="WhatsApp Business logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">WhatsApp Business</p>
                        <p className="text-sm text-gray-500">Connect with tenants and send automated notifications</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                      onClick={() => setIsWhatsAppDrawerOpen(true)}
                    >
                      Connect
                    </button>
                  </div>
                  
                  {/* WhatsApp Business Drawer */}
                  <WhatsAppBusinessDrawer 
                    isOpen={isWhatsAppDrawerOpen}
                    onClose={() => setIsWhatsAppDrawerOpen(false)}
                  />

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#0078D4] bg-opacity-10 flex items-center justify-center">
                        <Image
                          src="/images/integrations/outlook.png"
                          alt="Outlook Calendar logo"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Outlook Calendar</p>
                        <p className="text-sm text-gray-500">Sync appointments and meetings</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">Banking</h2>
                <p className="mt-1 text-sm/6 text-gray-500">Connect your bank account for direct payments</p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-[#0077B6] bg-opacity-10 flex items-center justify-center">
                      <Image
                        src="/images/integrations/banking.png"
                        alt="Open Banking logo"
                        width={32}
                        height={32}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Open Banking</p>
                      <p className="text-sm text-gray-500">Connect your bank account for direct payments</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF]"
                    onClick={() => setIsBankAccountDrawerOpen(true)}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      <Dialog open={isChangePlanModalOpen} onClose={() => setIsChangePlanModalOpen(false)} className="relative z-50">
        <DialogBackdrop
          className="fixed inset-0 bg-black/30"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Change Subscription Plan</h2>
            
            <div className="mt-4">
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingInterval === 'monthly'
                      ? 'bg-[#D9E8FF] text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingInterval === 'yearly'
                      ? 'bg-[#D9E8FF] text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Annual billing (20% off)
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 ${
                      selectedPlan === key ? 'border-[#D9E8FF] ring-2 ring-[#D9E8FF]' : 'border-gray-200'
                    }`}
                  >
                    <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      £{billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice} / {billingInterval}
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePlanChange(key, billingInterval)}
                      disabled={isLoading || selectedPlan === key}
                      className={`mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold ${
                        selectedPlan === key
                          ? 'bg-[#D9E8FF] text-white'
                          : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {selectedPlan === key ? 'Current plan' : 'Select plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsChangePlanModalOpen(false)}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Bank Account Drawer */}
      <BankAccountDrawer 
        isOpen={isBankAccountDrawerOpen}
        onClose={() => setIsBankAccountDrawerOpen(false)}
      />

      {/* Accounting Software Drawer */}
      <AccountingSoftwareDrawer
        isOpen={isAccountingDrawerOpen}
        onClose={() => setIsAccountingDrawerOpen(false)}
      />
    </SidebarLayout>
  )
}