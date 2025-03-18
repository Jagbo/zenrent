'use client'

import { useParams } from 'next/navigation'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Link } from '../../../components/link'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'

// Reuse the sample data from the main residents page
const properties = [
  {
    id: '123-main',
    name: '123 Main Street',
    tenants: [
      {
        id: '1',
        name: 'Leslie Abbott',
        unit: 'Room 101',
        email: 'leslie.abbott@example.com',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        phone: '(555) 123-4567',
        leaseEnd: '8/15/2024',
        about: 'Tenant has been residing at the property since 2022. Consistently pays rent on time and maintains the unit well. Has requested permission for a small pet which is under review.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      // ... other tenants
    ]
  }
  // ... other properties
]

export default function ResidentDetails() {
  const params = useParams()
  const residentId = params.id as string

  // Find the tenant across all properties
  const tenant = properties.flatMap(p => p.tenants).find(t => t.id === residentId)
  const property = properties.find(p => p.tenants.some(t => t.id === residentId))

  if (!tenant) {
    return (
      <SidebarLayout
        navbar={
          <div className="flex items-center justify-between py-4">
            <Heading level={1} className="text-xl font-semibold">Resident Not Found</Heading>
          </div>
        }
        sidebar={<SidebarContent currentPath="/residents" />}
      >
        <div className="space-y-6">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Dashboard</Link>
            <span className="mx-2">/</span>
            <Link href="/residents" className="hover:text-gray-700">Residents</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Not Found</span>
          </div>
          <div className="text-center py-12">
            <h3 className="text-base font-semibold text-gray-900">Resident not found</h3>
            <p className="mt-1 text-sm text-gray-500">The resident you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Resident Details</Heading>
        </div>
      }
      sidebar={<SidebarContent currentPath="/residents" />}
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href="/residents" className="hover:text-gray-700">Residents</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{tenant.name}</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={tenant.image}
              alt={tenant.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <Heading level={1} className="text-2xl font-bold">{tenant.name}</Heading>
              <Text className="text-gray-500 mt-1">{property?.name} • {tenant.unit}</Text>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Message
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              Edit Details
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Tenant Info & Activity Feed (1/3 width) */}
          <div className="col-span-1 space-y-6">
            {/* Tenant Information Card */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">Tenant Information</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Personal details and lease information.</p>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Full name</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.name}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Room</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.unit}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Email</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.email}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Phone</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.phone}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Lease ends</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.leaseEnd}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">Activity Feed</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Recent activity for this tenant.</p>
              </div>
              <div className="border-t border-gray-100">
                <ul className="divide-y divide-gray-100">
                  {/* Sample activities - replace with real data */}
                  <li className="px-4 py-4">
                    <div className="flex space-x-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-900">Rent Payment Received</p>
                        <p className="text-sm text-gray-500">Monthly rent payment processed for March 2024</p>
                        <p className="text-xs text-gray-400">2 days ago</p>
                      </div>
                    </div>
                  </li>
                  <li className="px-4 py-4">
                    <div className="flex space-x-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-900">Maintenance Request</p>
                        <p className="text-sm text-gray-500">Submitted ticket for kitchen sink repair</p>
                        <p className="text-xs text-gray-400">1 week ago</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Chat Window (2/3 width) */}
          <div className="col-span-2 bg-white shadow-sm sm:rounded-lg border border-gray-200">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
              <h3 className="text-base/7 font-semibold text-gray-900">Messages</h3>
              <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Chat with {tenant.name}</p>
            </div>
            <div className="h-[600px] flex flex-col">
              {/* Chat Messages Area */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Sample messages - replace with real chat data */}
                <div className="flex justify-end">
                  <div className="bg-indigo-50 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-gray-900">Hello! How can I help you today?</p>
                    <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-gray-900">I have a question about my lease renewal.</p>
                    <p className="text-xs text-gray-500 mt-1">10:32 AM</p>
                  </div>
                </div>
              </div>
              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}