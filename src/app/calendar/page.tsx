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
  CodeBracketIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon
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

export default function Calendar() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Calendar</Heading>
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
            <SidebarItem href="/calendar" current className="justify-start gap-3 pl-2">
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
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Calendar</span>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Calendar</Heading>
            <Text className="text-gray-500 mt-1">Schedule and manage your property appointments and events.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Today
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Add Event
            </button>
          </div>
        </div>
        
        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-500">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <h2 className="ml-4 text-xl font-semibold text-gray-900">March 2024</h2>
            </div>
            <div className="flex">
              <button className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
                Month
              </button>
              <button className="ml-2 px-3 py-1 rounded-md text-sm font-medium text-gray-400 hover:text-gray-700">
                Week
              </button>
              <button className="ml-2 px-3 py-1 rounded-md text-sm font-medium text-gray-400 hover:text-gray-700">
                Day
              </button>
              <button className="ml-2 px-3 py-1 rounded-md text-sm font-medium text-gray-400 hover:text-gray-700">
                List
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sun</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Mon</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tue</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Wed</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Thu</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fri</div>
            <div className="bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sat</div>
            
            {/* Days from previous month */}
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">25</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">26</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">27</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">28</div>
            </div>
            <div className="bg-white h-32 p-2 text-gray-400">
              <div className="text-sm">29</div>
            </div>
            
            {/* Days from current month */}
            <div className="bg-white h-32 p-2">
              <div className="text-sm">1</div>
              <div className="mt-1 text-xs p-1 bg-blue-100 text-blue-800 rounded">Property Inspection</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">2</div>
            </div>
            
            <div className="bg-white h-32 p-2">
              <div className="text-sm">3</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">4</div>
              <div className="mt-1 text-xs p-1 bg-green-100 text-green-800 rounded">Rent Due</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">5</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">6</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">7</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">8</div>
              <div className="mt-1 text-xs p-1 bg-purple-100 text-purple-800 rounded">Maintenance Visit</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">9</div>
            </div>
            
            {/* Additional rows would continue... */}
            {/* Current day highlight */}
            <div className="bg-white h-32 p-2 border-2 border-blue-500">
              <div className="text-sm font-bold">10</div>
            </div>
            
            {/* Remaining calendar cells would follow with appropriate events */}
            <div className="bg-white h-32 p-2">
              <div className="text-sm">11</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">12</div>
              <div className="mt-1 text-xs p-1 bg-red-100 text-red-800 rounded">Tenant Meeting</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">13</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">14</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">15</div>
              <div className="mt-1 text-xs p-1 bg-yellow-100 text-yellow-800 rounded">Property Showing</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">16</div>
            </div>
            
            <div className="bg-white h-32 p-2">
              <div className="text-sm">17</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">18</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">19</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">20</div>
              <div className="mt-1 text-xs p-1 bg-blue-100 text-blue-800 rounded">Supplier Meeting</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">21</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">22</div>
            </div>
            <div className="bg-white h-32 p-2">
              <div className="text-sm">23</div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
            <p className="text-sm text-gray-500">Your scheduled appointments for the next 7 days.</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-500">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Property Inspection</p>
                  <p className="text-sm text-gray-500">March 10, 2024</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Sunset Apartments, 9:00 AM - 11:00 AM</p>
              </div>
            </div>
            
            <div className="px-6 py-4 flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-red-100 flex items-center justify-center text-red-500">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Tenant Meeting</p>
                  <p className="text-sm text-gray-500">March 12, 2024</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Oakwood Heights, 2:00 PM - 3:00 PM</p>
              </div>
            </div>
            
            <div className="px-6 py-4 flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-yellow-100 flex items-center justify-center text-yellow-500">
                <BuildingOfficeIcon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Property Showing</p>
                  <p className="text-sm text-gray-500">March 15, 2024</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Parkview Residences, 3:30 PM - 4:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
} 