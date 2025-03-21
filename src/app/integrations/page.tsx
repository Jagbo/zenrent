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
  const [step, setStep] = useState<number>(1);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState<string | null>(null);

  // Get properties from the properties array
  const properties = [
    { id: '123-main', name: '123 Main Street' },
    { id: '456-park', name: '456 Park Avenue' },
    { id: '789-ocean', name: '789 Ocean Drive' },
    { id: '321-victoria', name: '321 Victoria Road' },
    { id: '654-royal', name: '654 Royal Crescent' },
    { id: '987-kings', name: '987 Kings Road' },
  ];

  useEffect(() => {
    // Create a Plaid Link token when component mounts
    const createLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            country_codes: ['GB'],
            language: 'en',
          }),
        });
        const data = await response.json();
        setPlaidLinkToken(data.link_token);
      } catch (error) {
        console.error('Error creating Plaid Link token:', error);
      }
    };
    createLinkToken();
  }, []);

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          property_id: selectedProperty,
        }),
      });
      
      if (response.ok) {
        // Move to success step
        setStep(3);
      } else {
        throw new Error('Failed to exchange token');
      }
    } catch (error) {
      console.error('Error exchanging Plaid token:', error);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select Property</h3>
          <p className="text-sm text-gray-500">Choose which property this bank account is for</p>
        </div>

        <div className="space-y-4">
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => {
                setSelectedProperty(property.id);
                setStep(2);
              }}
              className={classNames(
                'flex items-center justify-between p-4 rounded-lg border cursor-pointer',
                selectedProperty === property.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              )}
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{property.name}</p>
                </div>
              </div>
              <input
                type="radio"
                checked={selectedProperty === property.id}
                onChange={() => {}}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    if (!plaidLinkToken) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Connect Your Bank</h3>
            <p className="text-sm text-gray-500">Loading bank connection...</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Connect Your Bank</h3>
          <p className="text-sm text-gray-500">Securely connect your bank account using Plaid</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-200">
            <p className="text-sm">You'll be redirected to your bank's secure login page to authorize access</p>
          </div>

          <Button 
            className="w-full" 
            onClick={() => {
              if (typeof window.Plaid === 'undefined') {
                console.error('Plaid script not loaded');
                return;
              }
              // Initialize Plaid Link
              const plaidHandler = window.Plaid.create({
                token: plaidLinkToken,
                onSuccess: (public_token: string) => {
                  setPlaidPublicToken(public_token);
                  handlePlaidSuccess(public_token);
                },
                onExit: () => {
                  // Handle exit
                  console.log('User exited Plaid Link');
                },
                onEvent: (eventName: string) => {
                  // Handle events
                  console.log('Plaid Link event:', eventName);
                },
              });
              plaidHandler.open();
            }}
          >
            Connect Bank Account
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Connection Successful</h3>
          <p className="text-sm text-gray-500">Your bank account has been successfully connected</p>
        </div>

        <div className="p-4 rounded-lg border border-green-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-700">Bank account connected successfully</p>
          </div>
        </div>

        <Button className="w-full" onClick={() => window.location.reload()}>
          Done
        </Button>
      </div>
    );
  }

  return null;
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
              <SheetHeader>
                <SheetTitle>Connect Accounting Software</SheetTitle>
              </SheetHeader>
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
              <SheetHeader>
                <SheetTitle>Connect WhatsApp Business</SheetTitle>
              </SheetHeader>
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
              <SheetHeader>
                <SheetTitle>Connect Bank Account</SheetTitle>
              </SheetHeader>
              <BankIntegration />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </SidebarLayout>
  )
} 