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
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ExclamationCircleIcon, 
  BanknotesIcon, 
  ShoppingBagIcon,
  CodeBracketIcon 
} from '@heroicons/react/24/solid'

// Icons for navigation items
function DashboardIcon() {
  return <HomeIcon className="w-5 h-5" />
}

function PropertiesIcon() {
  return <BuildingOfficeIcon className="w-5 h-5" />
}

function ResidentsIcon() {
  return <UsersIcon className="w-5 h-5" />
}

function CalendarIconComponent() {
  return <CalendarIcon className="w-5 h-5" />
}

function IssuesIcon() {
  return <ExclamationCircleIcon className="w-5 h-5" />
}

function FinancialIcon() {
  return <BanknotesIcon className="w-5 h-5" />
}

function SuppliersIcon() {
  return <ShoppingBagIcon className="w-5 h-5" />
}

function IntegrationsIcon() {
  return <CodeBracketIcon className="w-5 h-5" />
}

export default function Suppliers() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Suppliers</Heading>
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
            <SidebarItem href="/residents" className="justify-start gap-3 pl-2">
              <ResidentsIcon />
              <span>Residents</span>
            </SidebarItem>
            <SidebarItem href="/calendar" className="justify-start gap-3 pl-2">
              <CalendarIconComponent />
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
            <SidebarItem href="/suppliers" current className="justify-start gap-3 pl-2">
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
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Suppliers</span>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Suppliers</Heading>
            <Text className="text-gray-500 mt-1">Manage your property maintenance and service providers.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Export
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              Add Supplier
            </button>
          </div>
        </div>
        
        {/* Suppliers Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Supplier Directory</h3>
            <p className="text-sm text-gray-500">All your property maintenance and service providers in one place.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ABC Plumbing</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Plumbing</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">john@abcplumbing.com</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">★★★★☆</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">City Electric</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Electrical</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">info@cityelectric.com</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">★★★★★</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Green Landscaping</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Landscaping</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">contact@greenlandscaping.com</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">★★★☆☆</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Secure Locks</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Security</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">support@securelocks.com</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">★★★★☆</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">FastClean Services</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cleaning</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">schedule@fastclean.com</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">★★★★☆</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
} 