'use client'

import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarItem 
} from '../components/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BuildingOfficeIcon, 
  HomeIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

// Navigation Icons
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )
}

function PropertiesIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.006 3.705a.75.75 0 1 0-.512-1.41L6 6.838V3a.75.75 0 0 0-.75-.75h-1.5A.75.75 0 0 0 3 3v4.93l-1.006.365a.75.75 0 0 0 .512 1.41l16.5-6Z" />
      <path fillRule="evenodd" d="M3.019 11.114 18 5.667v3.421l4.006 1.457a.75.75 0 1 1-.512 1.41l-.494-.18v8.475h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3v-9.129l.019-.007ZM18 20.25v-9.566l1.5.546v9.02H18Zm-9-6a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75H9Z" clipRule="evenodd" />
    </svg>
  )
}

function ResidentsIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
    </svg>
  )
}

function IssuesIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  )
}

function FinancialIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
    </svg>
  )
}

function SuppliersIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
      <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3Zm3-6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-3Zm8.25-.75a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-5.25a.75.75 0 0 0-.75-.75h-3Z" clipRule="evenodd" />
    </svg>
  )
}

function IntegrationsIcon() {
  return (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  )
}

// Types
interface Property {
  id: string
  name: string
  address: string
  type: string
  units: number
  occupancyRate: number
  monthlyRevenue: number
  image: string
}

// Sample data
const properties: Property[] = [
  {
    id: '123-main',
    name: '123 Main Street',
    address: 'Manchester, M1 1AA',
    type: 'Apartment Building',
    units: 12,
    occupancyRate: 92,
    monthlyRevenue: 15000,
    image: '/properties/manchester-apartment.jpg'
  },
  {
    id: '456-park',
    name: '456 Park Avenue',
    address: 'Liverpool, L1 1AA',
    type: 'Townhouse Complex',
    units: 8,
    occupancyRate: 100,
    monthlyRevenue: 12000,
    image: '/properties/liverpool-townhouse.jpg'
  },
  {
    id: '789-ocean',
    name: '789 Ocean Drive',
    address: 'Brighton, BN1 1AA',
    type: 'Apartment Building',
    units: 15,
    occupancyRate: 87,
    monthlyRevenue: 18000,
    image: '/properties/brighton-apartment.jpg'
  },
  {
    id: '321-victoria',
    name: '321 Victoria Road',
    address: 'Edinburgh, EH1 1AA',
    type: 'Victorian Houses',
    units: 6,
    occupancyRate: 100,
    monthlyRevenue: 9000,
    image: '/properties/edinburgh-victorian.jpg'
  },
  {
    id: '654-royal',
    name: '654 Royal Crescent',
    address: 'Bath, BA1 1AA',
    type: 'Heritage Building',
    units: 10,
    occupancyRate: 90,
    monthlyRevenue: 14000,
    image: '/properties/bath-heritage.jpg'
  },
  {
    id: '987-kings',
    name: '987 Kings Road',
    address: 'London, SW3 1AA',
    type: 'Luxury Apartments',
    units: 20,
    occupancyRate: 95,
    monthlyRevenue: 45000,
    image: '/properties/london-luxury.jpg'
  }
]

export default function Properties() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Properties</Heading>
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
            <SidebarItem href="/properties" current className="justify-start gap-3 pl-2">
              <PropertiesIcon />
              <span>Properties</span>
            </SidebarItem>
            <SidebarItem href="/residents" className="justify-start gap-3 pl-2">
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
          <span className="text-gray-900 font-medium">Properties</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Properties</Heading>
            <Text className="text-gray-500 mt-1">Manage and monitor your property portfolio.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              <PlusIcon className="h-5 w-5 mr-1.5" />
              Add Property
            </button>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, index) => (
            <div
              key={property.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Property Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={property.image}
                  alt={property.name}
                  width={800}
                  height={400}
                  className="object-cover w-full h-full"
                  priority={index < 3}
                />
              </div>

              {/* Property Details */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{property.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${property.occupancyRate === 100 ? 'bg-green-100 text-green-800' : 
                      property.occupancyRate >= 90 ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {property.occupancyRate}% Occupied
                  </span>
                </div>

                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4 mr-1.5" />
                  {property.address}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <HomeIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-sm text-gray-500">{property.type}</span>
                  </div>
                  <div className="flex items-center">
                    <UsersIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-sm text-gray-500">{property.units} Units</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Monthly Revenue</span>
                    <span className="text-lg font-medium text-gray-900">
                      £{property.monthlyRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  )
} 