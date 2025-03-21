'use client'

import { useParams } from 'next/navigation'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Link } from '../../../components/link'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

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
        phone: '+44 7123 456789',
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
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editedResident, setEditedResident] = useState({
    name: '',
    email: '',
    phone: '',
    unit: '',
    leaseEnd: '',
    about: ''
  });

  // Find the tenant across all properties
  const tenant = properties.flatMap(p => p.tenants).find(t => t.id === residentId)
  const property = properties.find(p => p.tenants.some(t => t.id === residentId))

  if (!tenant) {
    return (
      <SidebarLayout
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

  const handleEditClick = () => {
    if (tenant) {
      setEditedResident({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        unit: tenant.unit,
        leaseEnd: tenant.leaseEnd,
        about: tenant.about
      });
      setIsEditDrawerOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedResident(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the resident details to your backend
    console.log('Updated resident:', editedResident);
    setIsEditDrawerOpen(false);
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/residents" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Resident Details</Heading>
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
            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* Edit Drawer */}
        {isEditDrawerOpen && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-transparent transition-opacity" 
                onClick={() => setIsEditDrawerOpen(false)}
              />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 z-50">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto py-6">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Edit Resident Details</h2>
                          <button
                            type="button"
                            className="ml-3 flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={() => setIsEditDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 px-4 sm:px-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Full name
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={editedResident.name}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email address
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              value={editedResident.email}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Phone number
                            </label>
                            <input
                              type="text"
                              name="phone"
                              id="phone"
                              value={editedResident.phone}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                              Room/Unit
                            </label>
                            <input
                              type="text"
                              name="unit"
                              id="unit"
                              value={editedResident.unit}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="leaseEnd" className="block text-sm font-medium text-gray-700">
                              Lease end date
                            </label>
                            <input
                              type="text"
                              name="leaseEnd"
                              id="leaseEnd"
                              value={editedResident.leaseEnd}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                              About
                            </label>
                            <textarea
                              name="about"
                              id="about"
                              rows={4}
                              value={editedResident.about}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="mt-5 sm:mt-6">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:text-sm"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">About</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{tenant.about}</dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Documents</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      <ul className="divide-y divide-gray-100">
                        {tenant.attachments.map((attachment) => (
                          <li key={attachment.name} className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <PaperClipIcon className="h-4 w-4 flex-shrink-0 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700">{attachment.name} ({attachment.size})</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* New Activity Feed */}
            <div className="bg-white shadow-sm sm:rounded-lg border border-gray-200">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">Activity Feed</h3>
              </div>
              <div className="border-t border-gray-100 p-4">
                <div className='use client'>
                  <ul role="list" className="space-y-6">
                    <li className="relative flex gap-x-4">
                      <div className="absolute top-0 left-0 flex w-6 justify-center -bottom-6">
                        <div className="w-px bg-gray-200" />
                      </div>
                      <img src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" className="relative mt-3 size-6 flex-none rounded-full bg-gray-50" alt="" />
                      <div className="flex-auto rounded-md p-3 ring-1 ring-gray-200 ring-inset">
                        <div className="flex justify-between gap-x-4">
                          <div className="py-0.5 text-xs/5 text-gray-500">
                            <span className="font-medium text-gray-900">Chelsea Hagon</span> commented
                          </div>
                          <time className="flex-none py-0.5 text-xs/5 text-gray-500">3d ago</time>
                        </div>
                        <p className="text-sm/6 text-gray-500">Called client, they reassured me the invoice would be paid by the 25th.</p>
                      </div>
                    </li>
                    <li className="relative flex gap-x-4">
                      <div className="absolute top-0 left-0 flex w-6 justify-center -bottom-6">
                        <div className="w-px bg-gray-200" />
                      </div>
                      <div className="relative flex size-6 flex-none items-center justify-center bg-white">
                        <div className="size-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                      </div>
                      <p className="flex-auto py-0.5 text-xs/5 text-gray-500">
                        <span className="font-medium text-gray-900">Chelsea Hagon</span> edited the invoice.
                      </p>
                      <time className="flex-none py-0.5 text-xs/5 text-gray-500">6d ago</time>
                    </li>
                    <li className="relative flex gap-x-4">
                      <div className="absolute top-0 left-0 flex w-6 justify-center h-6">
                        <div className="w-px bg-gray-200" />
                      </div>
                      <div className="relative flex size-6 flex-none items-center justify-center bg-white">
                        <div className="size-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                      </div>
                      <p className="flex-auto py-0.5 text-xs/5 text-gray-500">
                        <span className="font-medium text-gray-900">Alex Curren</span> paid the invoice.
                      </p>
                      <time className="flex-none py-0.5 text-xs/5 text-gray-500">1d ago</time>
                    </li>
                  </ul>

                  {/* New comment form */}
                  <div className="mt-6 flex gap-x-3">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" className="size-6 flex-none rounded-full bg-gray-50" alt="" />
                    <form action="#" className="relative flex-auto">
                      <div className="overflow-hidden rounded-lg pb-12 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                        <label htmlFor="comment" className="sr-only">Add your comment</label>
                        <textarea id="comment" name="comment" rows={2} className="block w-full resize-none bg-transparent px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6" placeholder="Add your comment..." defaultValue={''} />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pr-2 pl-3">
                        <div className="flex items-center space-x-5">
                          <div className="flex items-center">
                            <button type="button" className="-m-2.5 flex size-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500">
                              <PaperClipIcon aria-hidden="true" className="size-5" />
                              <span className="sr-only">Attach a file</span>
                            </button>
                          </div>
                        </div>
                        <button type="submit" className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50">
                          Comment
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity Timeline (2/3 width) */}
          <div className="col-span-2 bg-white shadow-sm sm:rounded-lg border border-gray-200">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base/7 font-semibold text-gray-900">Chat with {tenant.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Send and receive messages</p>
                </div>
                <button
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 relative"
                >
                  <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-md">
                    <span className="text-sm text-gray-700">Connect WhatsApp</span>
                  </div>
                  Message
                </button>
              </div>
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
                <div className="flex justify-end">
                  <div className="bg-indigo-50 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-gray-900">Of course, I'd be happy to discuss your lease renewal. Your current lease ends on {tenant.leaseEnd}. Would you like to extend it for another year?</p>
                    <p className="text-xs text-gray-500 mt-1">10:33 AM</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-gray-900">Yes, I'm interested in extending. Will the rent stay the same?</p>
                    <p className="text-xs text-gray-500 mt-1">10:35 AM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-indigo-50 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-gray-900">There will be a small increase of about 3% in line with market rates. I can send you the new lease agreement for review if you'd like.</p>
                    <p className="text-xs text-gray-500 mt-1">10:36 AM</p>
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