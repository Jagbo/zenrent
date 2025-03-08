'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem 
} from '../components/sidebar'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { Link } from '../../components/link'
import Image from 'next/image'

// Icons for navigation items (same as in dashboard)
function DashboardIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )
}

function PropertiesIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.006 3.705a.75.75 0 1 0-.512-1.41L6 6.838V3a.75.75 0 0 0-.75-.75h-1.5A.75.75 0 0 0 3 3v4.93l-1.006.365a.75.75 0 0 0 .512 1.41l16.5-6Z" />
      <path fillRule="evenodd" d="M3.019 11.114 18 5.667v3.421l4.006 1.457a.75.75 0 1 1-.512 1.41l-.494-.18v8.475h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3v-9.129l.019-.007ZM18 20.25v-9.566l1.5.546v9.02H18Zm-9-6a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75H9Z" clipRule="evenodd" />
    </svg>
  )
}

function ResidentsIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
    </svg>
  )
}

function IssuesIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  )
}

function FinancialIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
    </svg>
  )
}

function SuppliersIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
      <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3Zm3-6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-3Zm8.25-.75a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-5.25a.75.75 0 0 0-.75-.75h-3Z" clipRule="evenodd" />
    </svg>
  )
}

function IntegrationsIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  )
}

// Types
interface Tenant {
  id: string
  name: string
  unit: string
  email: string
  image: string
  phone: string
  leaseEnd: string
  about: string
  attachments: {
    name: string
    size: string
  }[]
}

interface Property {
  id: string
  name: string
  tenants: Tenant[]
}

// Sample data
const properties: Property[] = [
  {
    id: '123-main',
    name: '123 Main Street',
    tenants: [
      {
        id: '1',
        name: 'Leslie Abbott',
        unit: 'Unit 101',
        email: 'leslie.abbott@example.com',
        image: '/avatars/leslie.jpg',
        phone: '(555) 123-4567',
        leaseEnd: '8/15/2024',
        about: 'Tenant has been residing at the property since 2022. Consistently pays rent on time and maintains the unit well. Has requested permission for a small pet which is under review.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      {
        id: '2',
        name: 'Hector Adams',
        unit: 'Unit 102',
        email: 'hector.adams@example.com',
        image: '/avatars/hector.jpg',
        phone: '(555) 234-5678',
        leaseEnd: '9/30/2024',
        about: 'New tenant since January 2024. Works remotely as a software engineer.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      {
        id: '3',
        name: 'Blake Alexander',
        unit: 'Unit 103',
        email: 'blake.alexander@example.com',
        image: '/avatars/blake.jpg',
        phone: '(555) 345-6789',
        leaseEnd: '12/31/2024',
        about: 'Long-term tenant since 2020. Active in community events.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      }
    ]
  },
  {
    id: '456-park',
    name: '456 Park Avenue',
    tenants: [
      {
        id: '4',
        name: 'Angela Beaver',
        unit: 'Unit 201',
        email: 'angela.beaver@example.com',
        image: '/avatars/angela.jpg',
        phone: '(555) 456-7890',
        leaseEnd: '7/31/2024',
        about: 'Tenant since 2023. Works as a teacher at the local school.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      {
        id: '5',
        name: 'Yvette Blanchard',
        unit: 'Unit 202',
        email: 'yvette.blanchard@example.com',
        image: '/avatars/yvette.jpg',
        phone: '(555) 567-8901',
        leaseEnd: '10/15/2024',
        about: 'New tenant as of March 2024. Professional chef.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      }
    ]
  },
  {
    id: '789-ocean',
    name: '789 Ocean Drive',
    tenants: [
      {
        id: '6',
        name: 'Jeffrey Clark',
        unit: 'Unit 301',
        email: 'jeffrey.clark@example.com',
        image: '/avatars/jeffrey.jpg',
        phone: '(555) 678-9012',
        leaseEnd: '6/30/2024',
        about: 'Tenant since 2021. Works in finance.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      {
        id: '7',
        name: 'Kathryn Cooper',
        unit: 'Unit 302',
        email: 'kathryn.cooper@example.com',
        image: '/avatars/kathryn.jpg',
        phone: '(555) 789-0123',
        leaseEnd: '11/30/2024',
        about: 'Recent tenant. Medical resident at nearby hospital.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      },
      {
        id: '8',
        name: 'Alicia Edwards',
        unit: 'Unit 303',
        email: 'alicia.edwards@example.com',
        image: '/avatars/alicia.jpg',
        phone: '(555) 890-1234',
        leaseEnd: '5/31/2024',
        about: 'Tenant since 2022. Graphic designer working remotely.',
        attachments: [
          { name: 'lease_agreement.pdf', size: '1.2mb' },
          { name: 'tenant_application.pdf', size: '2.8mb' }
        ]
      }
    ]
  }
]

export default function Residents() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all')

  const filteredProperties = selectedPropertyId === 'all' 
    ? properties 
    : properties.filter(p => p.id === selectedPropertyId)

  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Residents</Heading>
        </div>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Image src="/next.svg" alt="PropBot Logo" width={24} height={24} className="dark:invert" />
              </div>
              <Heading level={2} className="text-lg font-semibold">PropBot</Heading>
            </div>
          </SidebarHeader>
          <SidebarBody className="space-y-1">
            <SidebarItem href="/dashboard" className="justify-start gap-3 pl-2">
              <DashboardIcon />
              <span>Dashboard</span>
            </SidebarItem>
            <SidebarItem href="/properties" className="justify-start gap-3 pl-2">
              <PropertiesIcon />
              <span>Properties</span>
            </SidebarItem>
            <SidebarItem href="/residents" current className="justify-start gap-3 pl-2">
              <ResidentsIcon />
              <span>Residents</span>
            </SidebarItem>
            <SidebarItem href="/calendar" className="justify-start gap-3 pl-2">
              <CalendarIcon />
              <span>Calendar</span>
            </SidebarItem>
            <SidebarItem href="/issues" className="justify-start gap-3 pl-2">
              <IssuesIcon />
              <span>Issues</span>
            </SidebarItem>
            <SidebarItem href="/financial" className="justify-start gap-3 pl-2">
              <FinancialIcon />
              <span>Financial</span>
            </SidebarItem>
            <SidebarItem href="/suppliers" className="justify-start gap-3 pl-2">
              <SuppliersIcon />
              <span>Suppliers</span>
            </SidebarItem>
            <SidebarItem href="/integrations" className="justify-start gap-3 pl-2">
              <IntegrationsIcon />
              <span>Integrations</span>
            </SidebarItem>
          </SidebarBody>
          <SidebarFooter>
            <div className="px-2 py-2">
              <Text className="text-xs text-zinc-500">© 2024 PropBot</Text>
            </div>
          </SidebarFooter>
        </Sidebar>
      }
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Residents</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Residents</Heading>
            <Text className="text-gray-500 mt-1">Manage your residents and view tenant details.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              Add Resident
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Tenant List */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tenants by Property</h2>
              <p className="text-sm text-gray-500">Organized listing of all tenants by property.</p>
            </div>

            {/* Property Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200">
              <button
                onClick={() => setSelectedPropertyId('all')}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedPropertyId === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Properties
              </button>
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => setSelectedPropertyId(property.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    selectedPropertyId === property.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {property.name}
                </button>
              ))}
            </div>

            {/* Tenant List */}
            <div className="divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <div key={property.id}>
                  <div className="px-4 py-3 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900">{property.name}</h3>
                  </div>
                  {property.tenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => setSelectedTenant(tenant)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${
                        selectedTenant?.id === tenant.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Image
                        src={tenant.image}
                        alt={tenant.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-sm text-gray-500">{tenant.unit}</p>
                        <p className="text-sm text-gray-500">{tenant.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Tenant Details */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            {selectedTenant ? (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Tenant Information</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-500">View more</button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Personal details and lease information.</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTenant.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTenant.unit}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email address</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTenant.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTenant.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lease end date</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTenant.leaseEnd}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">About</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTenant.about}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attachments</label>
                    <div className="mt-1 space-y-2">
                      {selectedTenant.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 pl-3 pr-4 text-sm border rounded-md"
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-900">{attachment.name}</span>
                            <span className="ml-2 text-gray-500">{attachment.size}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-500">Download</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Tenant Selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Please select a tenant from the list on the left to view their details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
} 