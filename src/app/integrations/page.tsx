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
  CheckCircleIcon,
  XCircleIcon,
  CogIcon
} from '@heroicons/react/24/solid'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

export default function Integrations() {
  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Integrations</Heading>
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
            <SidebarItem href="/suppliers" className="justify-start gap-3 pl-2">
              <SuppliersIcon />
              <span>Suppliers</span>
            </SidebarItem>
            <SidebarItem href="/integrations" current className="justify-start gap-3 pl-2">
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
          <span className="text-gray-900 font-medium">Integrations</span>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">API Integrations</Heading>
            <Text className="text-gray-500 mt-1">Connect your property management system with third-party services.</Text>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              <CogIcon className="h-5 w-5 inline-block mr-1" />
              API Settings
            </button>
            <button className="px-4 py-2 bg-gray-900 rounded-md text-sm font-medium text-white hover:bg-gray-800">
              <PlusIcon className="h-5 w-5 inline-block mr-1" />
              Connect New API
            </button>
          </div>
        </div>
        
        {/* Integration Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Integrations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </CardContent>
          </Card>
          
          {/* Active Integrations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">8</p>
            </CardContent>
          </Card>
          
          {/* API Calls (Today) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">API Calls (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">2,458</p>
            </CardContent>
          </Card>
          
          {/* API Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">API Usage (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">68%</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Integrations Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Payment Processing */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment Processing</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription>Process payments and rent collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="Stripe" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">Stripe</p>
                    <p className="text-xs text-gray-500">Connected since Dec 2023</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              Last transaction: 2 hours ago
            </CardFooter>
          </Card>
          
          {/* Accounting Software */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Accounting</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription>Sync financial data with accounting software</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="QuickBooks" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">QuickBooks</p>
                    <p className="text-xs text-gray-500">Connected since Jan 2024</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              Last sync: 1 day ago
            </CardFooter>
          </Card>
          
          {/* CRM */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>CRM</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription>Customer relationship management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="Salesforce" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">Salesforce</p>
                    <p className="text-xs text-gray-500">Connected since Nov 2023</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              210 tenant records synced
            </CardFooter>
          </Card>
          
          {/* Document Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Document Management</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription>Store and manage property documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="DocuSign" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">DocuSign</p>
                    <p className="text-xs text-gray-500">Connected since Feb 2024</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              42 documents processed this month
            </CardFooter>
          </Card>
          
          {/* Background Checks */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Background Checks</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription>Tenant screening and verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="TransUnion" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">TransUnion</p>
                    <p className="text-xs text-gray-500">Connected since Dec 2023</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              8 screenings performed this month
            </CardFooter>
          </Card>
          
          {/* Communications */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Communications</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Disconnected
                </span>
              </div>
              <CardDescription>Email and SMS notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="Twilio" width={32} height={32} className="rounded mr-2 opacity-50" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Twilio</p>
                    <p className="text-xs text-gray-500">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Connect</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500">
              Enable SMS notifications for tenants
            </CardFooter>
          </Card>
        </div>
        
        {/* API Usage */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">API Usage</h3>
            <p className="text-sm text-gray-500">Monitor your API calls and usage limits.</p>
          </div>
          
          <div className="px-6 py-4">
            <div className="flex flex-col space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Monthly API Calls (68%)</span>
                  <span className="text-sm font-medium text-gray-700">68,453 / 100,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Webhook Events (42%)</span>
                  <span className="text-sm font-medium text-gray-700">8,453 / 20,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Authentication Tokens (12%)</span>
                  <span className="text-sm font-medium text-gray-700">121 / 1,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:underline">View detailed API logs</button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
} 