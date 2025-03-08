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
  PlusIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon
} from '@heroicons/react/24/solid'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function Issues() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Issues</Heading>
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
            <SidebarItem href="/issues" current className="justify-start gap-3 pl-2">
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
          <span className="text-gray-900 font-medium">Issues</span>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Maintenance Issues</Heading>
            <Text className="text-gray-500 mt-1">Track and manage property maintenance requests and issues.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 inline-block mr-1" />
              Filter
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Create Issue
            </button>
          </div>
        </div>
        
        {/* Issue Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Issues */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">35</p>
            </CardContent>
          </Card>
          
          {/* Open Issues */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">24</p>
            </CardContent>
          </Card>
          
          {/* In Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">8</p>
            </CardContent>
          </Card>
          
          {/* Completed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">12</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Issues Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {/* Issues Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">All Issues</h3>
                  <p className="text-sm text-gray-500">Recent maintenance requests and issues that need attention.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search issues..."
                      className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#1254</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Water leak in bathroom ceiling</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Open</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">High</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments Unit 204</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 8, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Smith</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#1253</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Broken heating system</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Progress</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Critical</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oakwood Heights Unit 103</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 7, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Robert Wilson</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#1252</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mailbox key replacement</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Open</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Low</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sunset Apartments Unit 112</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 6, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unassigned</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#1251</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Noisy neighbors complaint</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Open</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Medium</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Parkview Residences Unit 305</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 5, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sarah Johnson</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#1250</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Parking spot dispute</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Resolved</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Medium</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Oakwood Heights Unit 210</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 4, 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Michael Adams</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">View</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </a>
                  <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </a>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">35</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Previous</span>
                        {/* Heroicon name: chevron-left */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a href="#" aria-current="page" className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        1
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        2
                      </a>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        3
                      </a>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                      <a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        7
                      </a>
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Next</span>
                        {/* Heroicon name: chevron-right */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="board">
            {/* Kanban Board View */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Issues Board</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter cards..."
                      className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Open Column */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
                      Open
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">15</span>
                    </h4>
                    <button className="text-gray-500 hover:text-gray-700">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Card 1 */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500">#1254</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">High</span>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">Water leak in bathroom ceiling</h5>
                      <p className="mt-1 text-xs text-gray-500">Sunset Apartments Unit 204</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Mar 8, 2024</span>
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">JS</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 2 */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500">#1252</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Low</span>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">Mailbox key replacement</h5>
                      <p className="mt-1 text-xs text-gray-500">Sunset Apartments Unit 112</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Mar 6, 2024</span>
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-800">?</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 3 */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500">#1251</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Medium</span>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">Noisy neighbors complaint</h5>
                      <p className="mt-1 text-xs text-gray-500">Parkview Residences Unit 305</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Mar 5, 2024</span>
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-800">SJ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* In Progress Column */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                      In Progress
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">8</span>
                    </h4>
                    <button className="text-gray-500 hover:text-gray-700">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Card 1 */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500">#1253</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">Broken heating system</h5>
                      <p className="mt-1 text-xs text-gray-500">Oakwood Heights Unit 103</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Mar 7, 2024</span>
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-800">RW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resolved Column */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                      Resolved
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">12</span>
                    </h4>
                    <button className="text-gray-500 hover:text-gray-700">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Card 1 */}
                    <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-500">#1250</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Medium</span>
                      </div>
                      <h5 className="mt-2 text-sm font-medium text-gray-900">Parking spot dispute</h5>
                      <p className="mt-1 text-xs text-gray-500">Oakwood Heights Unit 210</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Mar 4, 2024</span>
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-800">MA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
} 