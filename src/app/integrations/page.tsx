'use client'

import { SidebarLayout } from '../components/sidebar-layout'
import { Heading } from '../components/heading'
import { Text } from '../components/text'
import { useState, useEffect } from 'react'
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
import { classNames } from '@/lib/utils'
import { WhatsAppBusinessDrawer } from '../components/WhatsAppBusinessDrawer'
import { BankAccountDrawer } from '../components/BankAccountDrawer'
import { AccountingSoftwareDrawer } from '../components/AccountingSoftwareDrawer'

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

// Add Facebook SDK type declarations
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (callback: (response: any) => void, options: { scope: string }) => void;
      WhatsAppSignup: {
        initiateWhatsAppSignup: (params: any) => void;
      };
    };
    Plaid?: {
      create: (config: any) => {
        open: () => void;
      };
    };
  }
}

export default function Integrations() {
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false)
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false)
  const [isAccountingDrawerOpen, setIsAccountingDrawerOpen] = useState(false)
  
  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/integrations" />}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Integrations</Heading>
            <Text className="text-gray-500 mt-1">Connect ZenRent with your favorite tools and services.</Text>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Accounting Software */}
          <Card className="cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setIsAccountingDrawerOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl">Accounting</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <CardDescription className="mt-1">Sync financial data with accounting software</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="QuickBooks" width={32} height={32} className="rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium">QuickBooks</p>
                    <p className="text-xs text-gray-500">Connected since Jan 2024</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline w-fit">Configure</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500 flex-wrap">
              Last sync: 1 day ago
            </CardFooter>
          </Card>
          
          {/* Communications */}
          <Card className="cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setIsWhatsAppDrawerOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl">Communications</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Disconnected
                </span>
              </div>
              <CardDescription className="mt-1">WhatsApp messaging for tenants and contractors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <Image src="/images/integrations/whatsapp.png" alt="WhatsApp" width={32} height={32} className="rounded mr-2 opacity-50" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">WhatsApp Business</p>
                    <p className="text-xs text-gray-500">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline w-fit">Connect</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500 flex-wrap">
              Enable WhatsApp messaging with tenants and contractors
            </CardFooter>
          </Card>

          {/* Bank Account */}
          <Card className="cursor-pointer hover:border-blue-200 transition-colors" onClick={() => setIsBankAccountDrawerOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl">Bank Account</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Disconnected
                </span>
              </div>
              <CardDescription className="mt-1">Connect your bank account for payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <Image src="/next.svg" alt="Bank" width={32} height={32} className="rounded mr-2 opacity-50" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Open Banking</p>
                    <p className="text-xs text-gray-500">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline w-fit">Connect</button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500 flex-wrap">
              Enable direct bank payments and reconciliation
            </CardFooter>
          </Card>

          {/* WhatsApp Business Drawer */}
          <WhatsAppBusinessDrawer 
            isOpen={isWhatsAppDrawerOpen}
            onClose={() => setIsWhatsAppDrawerOpen(false)}
          />

          {/* Bank Account Drawer */}
          <BankAccountDrawer 
            isOpen={isBankAccountDrawerOpen}
            onClose={() => setIsBankAccountDrawerOpen(false)}
          />

          {/* Accounting Software Drawer */}
          <AccountingSoftwareDrawer 
            isOpen={isAccountingDrawerOpen}
            onClose={() => setIsAccountingDrawerOpen(false)}
          />
        </div>
      </div>
    </SidebarLayout>
  )
} 