'use client'

import { useState } from 'react'
import { SidebarLayout } from '../components/sidebar-layout'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem,
  SidebarSection,
  SidebarHeading,
  SidebarLabel
} from '../components/sidebar'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { Link } from '../../components/link'
import Image from 'next/image'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { Square2StackIcon } from '@heroicons/react/24/outline'
import { SidebarContent } from '../components/sidebar-content'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'

// Icons for navigation items (same as in dashboard)
function DashboardIcon() {
  return (
    <svg data-slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.061-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
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
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
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
      {
        id: '2',
        name: 'Hector Adams',
        unit: 'Room 102',
        email: 'hector.adams@example.com',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 103',
        email: 'blake.alexander@example.com',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 201',
        email: 'angela.beaver@example.com',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 202',
        email: 'yvette.blanchard@example.com',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 301',
        email: 'jeffrey.clark@example.com',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 302',
        email: 'kathryn.cooper@example.com',
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
        unit: 'Room 303',
        email: 'alicia.edwards@example.com',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newResident, setNewResident] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyId: '',
    unitNumber: '',
    leaseStartDate: '',
    leaseEndDate: '',
    rentAmount: '',
    securityDeposit: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    occupants: '',
    pets: '',
    vehicleInfo: '',
    moveInDate: '',
    status: 'active',
    paymentMethod: 'bank_transfer',
    notes: ''
  });

  const filteredProperties = selectedPropertyId === 'all' 
    ? properties 
    : properties.filter(p => p.id === selectedPropertyId)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewResident(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the resident to your backend
    console.log('New resident:', newResident);
    setIsDrawerOpen(false);
    setNewResident({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      propertyId: '',
      unitNumber: '',
      leaseStartDate: '',
      leaseEndDate: '',
      rentAmount: '',
      securityDeposit: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      occupants: '',
      pets: '',
      vehicleInfo: '',
      moveInDate: '',
      status: 'active',
      paymentMethod: 'bank_transfer',
      notes: ''
    });
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/residents" />}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Residents</Heading>
            <Text className="text-gray-500 mt-1">Manage your property residents and tenants.</Text>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Resident
            </button>
          </div>
        </div>

        {/* Resident Form Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 overflow-hidden z-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-transparent transition-opacity" onClick={() => setIsDrawerOpen(false)} />
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 h-0 overflow-y-auto">
                      <div className="py-6 px-4 bg-gray-50 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Add New Resident</h2>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="px-4 sm:px-6">
                          <form onSubmit={handleSubmit} className="space-y-6 pt-6 pb-5">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  name="firstName"
                                  id="firstName"
                                  required
                                  value={newResident.firstName}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  name="lastName"
                                  id="lastName"
                                  required
                                  value={newResident.lastName}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                                Email Address
                              </label>
                              <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                value={newResident.email}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                required
                                value={newResident.phone}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="propertyId" className="block text-sm font-medium text-gray-900">
                                  Property
                                </label>
                                <select
                                  name="propertyId"
                                  id="propertyId"
                                  required
                                  value={newResident.propertyId}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                >
                                  <option value="">Select Property</option>
                                  <option value="123-main">123 Main Street</option>
                                  <option value="456-park">456 Park Avenue</option>
                                  <option value="789-ocean">789 Ocean Drive</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-900">
                                  Room Number
                                </label>
                                <input
                                  type="text"
                                  name="unitNumber"
                                  id="unitNumber"
                                  required
                                  value={newResident.unitNumber}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="leaseStartDate" className="block text-sm font-medium text-gray-900">
                                  Lease Start Date
                                </label>
                                <input
                                  type="date"
                                  name="leaseStartDate"
                                  id="leaseStartDate"
                                  required
                                  value={newResident.leaseStartDate}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="leaseEndDate" className="block text-sm font-medium text-gray-900">
                                  Lease End Date
                                </label>
                                <input
                                  type="date"
                                  name="leaseEndDate"
                                  id="leaseEndDate"
                                  required
                                  value={newResident.leaseEndDate}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="rentAmount" className="block text-sm font-medium text-gray-900">
                                  Monthly Rent ($)
                                </label>
                                <input
                                  type="number"
                                  name="rentAmount"
                                  id="rentAmount"
                                  required
                                  value={newResident.rentAmount}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-900">
                                  Security Deposit ($)
                                </label>
                                <input
                                  type="number"
                                  name="securityDeposit"
                                  id="securityDeposit"
                                  required
                                  value={newResident.securityDeposit}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-900">
                                  Emergency Contact Name
                                </label>
                                <input
                                  type="text"
                                  name="emergencyContactName"
                                  id="emergencyContactName"
                                  required
                                  value={newResident.emergencyContactName}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-900">
                                  Emergency Contact Phone
                                </label>
                                <input
                                  type="tel"
                                  name="emergencyContactPhone"
                                  id="emergencyContactPhone"
                                  required
                                  value={newResident.emergencyContactPhone}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="occupants" className="block text-sm font-medium text-gray-900">
                                Additional Occupants
                              </label>
                              <input
                                type="text"
                                name="occupants"
                                id="occupants"
                                value={newResident.occupants}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Names of additional occupants"
                              />
                            </div>

                            <div>
                              <label htmlFor="pets" className="block text-sm font-medium text-gray-900">
                                Pets
                              </label>
                              <input
                                type="text"
                                name="pets"
                                id="pets"
                                value={newResident.pets}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Type and number of pets"
                              />
                            </div>

                            <div>
                              <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-900">
                                Vehicle Information
                              </label>
                              <input
                                type="text"
                                name="vehicleInfo"
                                id="vehicleInfo"
                                value={newResident.vehicleInfo}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Make, model, and license plate"
                              />
                            </div>

                            <div>
                              <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-900">
                                Move-in Date
                              </label>
                              <input
                                type="date"
                                name="moveInDate"
                                id="moveInDate"
                                required
                                value={newResident.moveInDate}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                                Status
                              </label>
                              <select
                                name="status"
                                id="status"
                                required
                                value={newResident.status}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                                <option value="notice_given">Notice Given</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-900">
                                Preferred Payment Method
                              </label>
                              <select
                                name="paymentMethod"
                                id="paymentMethod"
                                required
                                value={newResident.paymentMethod}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                              >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="direct_debit">Direct Debit</option>
                                <option value="check">Check</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                                Additional Notes
                              </label>
                              <textarea
                                name="notes"
                                id="notes"
                                rows={3}
                                value={newResident.notes}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                                placeholder="Any additional information..."
                              />
                            </div>

                            <div className="mt-5 sm:mt-6">
                              <button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 sm:text-sm"
                              >
                                Add Resident
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
          </div>
        )}

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
                All
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
          <div className="flex-1">
            {selectedTenant ? (
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-gray-200">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base/7 font-semibold text-gray-900">Tenant Information</h3>
                      <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Personal details and lease information.</p>
                    </div>
                    <Link
                      href={`/residents/${selectedTenant.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View more
                    </Link>
                  </div>
                </div>
                <div className="border-t border-gray-100">
                  <dl className="divide-y divide-gray-100">
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Full name</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.name}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Room</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.unit}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Email address</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.email}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Phone number</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.phone}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Lease end date</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.leaseEnd}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">About</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{selectedTenant.about}</dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm/6 font-medium text-gray-900">Attachments</dt>
                      <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                          {selectedTenant.attachments.map((attachment, index) => (
                            <li key={index} className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                              <div className="flex w-0 flex-1 items-center">
                                <PaperClipIcon className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
                                <div className="ml-4 flex min-w-0 flex-1 gap-2">
                                  <span className="truncate font-medium">{attachment.name}</span>
                                  <span className="shrink-0 text-gray-400">{attachment.size}</span>
                                </div>
                              </div>
                              <div className="ml-4 shrink-0">
                                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white shadow-sm sm:rounded-lg">
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