'use client'

import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { useState } from 'react'
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
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SidebarContent } from '../components/sidebar-content'

interface IntegrationOptionProps {
  logo: string
  name: string
  onClick: () => void
  selected: boolean
}

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

// Integration option component
function IntegrationOption({ logo, name, onClick, selected }: IntegrationOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
      } flex items-center space-x-4 transition-all`}
    >
      <Image src={logo} alt={name} width={40} height={40} className="rounded" />
      <span className="text-lg font-medium">{name}</span>
      {selected && <ArrowRightIcon className="w-5 h-5 ml-auto text-blue-500" />}
    </button>
  )
}

// WhatsApp Integration Steps
function WhatsAppIntegration() {
  const [step, setStep] = useState(1)
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Connect WhatsApp Business</h3>
        <p className="text-sm text-gray-500">Follow these steps to integrate WhatsApp Business API</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">1</span>
            <span className="font-medium">Verify your business</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 ml-8">We'll need to verify your business before setting up WhatsApp Business API</p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">2</span>
            <span className="font-medium">Connect your WhatsApp number</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 ml-8">Link your business phone number to enable WhatsApp messaging</p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">3</span>
            <span className="font-medium">Set up messaging templates</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 ml-8">Create message templates for automated communications</p>
        </div>
      </div>

      <Button className="w-full" onClick={() => setStep(step + 1)}>
        Start Verification
      </Button>
    </div>
  )
}

// Accounting Integration Steps
function AccountingIntegration() {
  const [step, setStep] = useState<number>(1)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const providers = [
    { name: 'QuickBooks', logo: '/images/integrations/quickbooks.png' },
    { name: 'Xero', logo: '/images/integrations/Xero.png' },
    { name: 'Sage', logo: '/images/integrations/sage.png' },
  ]

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Choose your accounting software</h3>
          <p className="text-sm text-gray-500">Select the accounting software you use to manage your business</p>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <IntegrationOption
              key={provider.name}
              logo={provider.logo}
              name={provider.name}
              selected={selectedProvider === provider.name}
              onClick={() => {
                setSelectedProvider(provider.name)
                setStep(2)
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Connect to {selectedProvider}</h3>
        <p className="text-sm text-gray-500">Follow these steps to connect your {selectedProvider} account</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200">
          <p className="text-sm">You'll be redirected to {selectedProvider} to authorize access to your account</p>
        </div>
      </div>

      <Button className="w-full" onClick={() => {}}>
        Connect to {selectedProvider}
      </Button>
    </div>
  )
}

// Bank Integration Steps
function BankIntegration() {
  const [step, setStep] = useState<number>(1)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)

  const banks = [
    { name: 'Barclays', logo: '/next.svg' },
    { name: 'HSBC', logo: '/next.svg' },
    { name: 'Lloyds', logo: '/next.svg' },
    { name: 'NatWest', logo: '/next.svg' },
    { name: 'Santander', logo: '/next.svg' },
  ]

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select your bank</h3>
          <p className="text-sm text-gray-500">Choose your bank to set up Open Banking integration</p>
        </div>

        <div className="space-y-4">
          {banks.map((bank) => (
            <IntegrationOption
              key={bank.name}
              logo={bank.logo}
              name={bank.name}
              selected={selectedBank === bank.name}
              onClick={() => {
                setSelectedBank(bank.name)
                setStep(2)
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Connect to {selectedBank}</h3>
        <p className="text-sm text-gray-500">Follow these steps to connect your {selectedBank} account</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200">
          <p className="text-sm">You'll be redirected to {selectedBank}'s secure login page to authorize access</p>
        </div>
      </div>

      <Button className="w-full" onClick={() => {}}>
        Connect to {selectedBank}
      </Button>
    </div>
  )
}

export default function Integrations() {
  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/integrations" />}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Integrations</Heading>
            <Text className="text-gray-500 mt-1">Connect your property management system with third-party services.</Text>
          </div>
        </div>
        
        {/* Integrations Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Accounting Software */}
          <Sheet>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:border-blue-200 transition-colors">
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
            </SheetTrigger>
            <SheetContent>
              <AccountingIntegration />
            </SheetContent>
          </Sheet>
          
          {/* Communications */}
          <Sheet>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Communications</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Disconnected
                    </span>
                  </div>
                  <CardDescription>WhatsApp messaging for tenants and contractors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image src="/images/integrations/whatsapp.png" alt="WhatsApp" width={32} height={32} className="rounded mr-2 opacity-50" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">WhatsApp Business</p>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 hover:underline">Connect</button>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 text-xs text-gray-500">
                  Enable WhatsApp messaging with tenants and contractors
                </CardFooter>
              </Card>
            </SheetTrigger>
            <SheetContent>
              <WhatsAppIntegration />
            </SheetContent>
          </Sheet>

          {/* Bank Account */}
          <Sheet>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Bank Account</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Disconnected
                    </span>
                  </div>
                  <CardDescription>Connect your bank account for payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image src="/next.svg" alt="Bank" width={32} height={32} className="rounded mr-2 opacity-50" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Open Banking</p>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 hover:underline">Connect</button>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 text-xs text-gray-500">
                  Enable direct bank payments and reconciliation
                </CardFooter>
              </Card>
            </SheetTrigger>
            <SheetContent>
              <BankIntegration />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </SidebarLayout>
  )
} 