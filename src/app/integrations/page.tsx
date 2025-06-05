"use client";

import { SidebarLayout } from "../components/sidebar-layout";
import { Heading } from "../components/heading";
import { Text } from "../components/text";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
} from "../components/sidebar";
import Link from "next/link";
import Image from "next/image";
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
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "../components/sidebar-content";
import { classNames } from "@/utils/classNames";
import { BankAccountDrawer } from "./components/BankAccountDrawer";
import { AccountingSoftwareDrawer } from "../components/AccountingSoftwareDrawer";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

interface IntegrationOptionProps {
  logo: string;
  name: string;
  onClick: () => void;
  selected: boolean;
}

// Icons for navigation items
function DashboardIcon() {
  return <HomeIcon className="w-5 h-5" />;
}

function PropertiesIcon() {
  return <BuildingOfficeIcon className="w-5 h-5" />;
}

function ResidentsIcon() {
  return <UsersIcon className="w-5 h-5" />;
}

function CalendarIconComponent() {
  return <CalendarIcon className="w-5 h-5" />;
}

function IssuesIcon() {
  return <ExclamationCircleIcon className="w-5 h-5" />;
}

function FinancialIcon() {
  return <BanknotesIcon className="w-5 h-5" />;
}

function SuppliersIcon() {
  return <ShoppingBagIcon className="w-5 h-5" />;
}

function IntegrationsIcon() {
  return <CodeBracketIcon className="w-5 h-5" />;
}

// Integration option component
function IntegrationOption({
  logo,
  name,
  onClick,
  selected,
}: IntegrationOptionProps) {
  return (
    <button onClick={onClick}
      className={`w-full p-4 rounded-lg border ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-200"
      } flex items-center space-x-4 transition-all`}
    >
      <Image src={logo} alt={name} width={40} height={40} className="rounded" />
      <span className="text-lg font-medium">{name}</span>
      {selected && <ArrowRightIcon className="w-5 h-5 ml-auto text-blue-500" />}
    </button>
  );
}

export default function Integrations() {
  const router = useRouter();
  const [isBankAccountDrawerOpen, setIsBankAccountDrawerOpen] = useState(false);
  const [isAccountingDrawerOpen, setIsAccountingDrawerOpen] = useState(false);
  const [isBankDrawerOpen, setIsBankDrawerOpen] = useState(false);
  const [isBankConnected, setIsBankConnected] = useState(false);
  const [bankConnectionInfo, setBankConnectionInfo] = useState<{
    name: string;
    connectedDate: string;
  }>({
    name: 'Your Bank',
    connectedDate: 'recently'
  });

  // Check if bank is connected using Supabase
  useEffect(() => {
    const checkBankConnections = async () => {
      try {
        // Import supabase from your lib
        const { supabase } = await import('@/lib/supabase');
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No authenticated user');
          return;
        }
        
        // Get properties for the user
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', user.id);
          
        if (propertiesError) {
          console.error('Error fetching properties:', propertiesError);
          return;
        }
        
        if (!properties || properties.length === 0) {
          console.log('No properties found');
          return;
        }
        
        // Check if any property has a bank connection
        const propertyIds = properties.map(p => p.id);
        
        const { data: connections, error: connectionsError } = await supabase
          .from('bank_connections')
          .select('property_id, created_at')
          .in('property_id', propertyIds.map(id => id.toString()));
          
        if (connectionsError) {
          console.error('Error fetching bank connections:', connectionsError);
          return;
        }
        
        // If connections exist, update the UI
        if (connections && connections.length > 0) {
          setIsBankConnected(true);
          
          // Format the date
          const connectionDate = new Date(connections[0].created_at).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric'
          });
          
          const connectionInfo = {
            name: 'Connected Bank',
            connectedDate: connectionDate
          };
          
          setBankConnectionInfo(connectionInfo);
          
          // Still save to localStorage for backup
          localStorage.setItem('bankConnected', 'true');
          localStorage.setItem('bankConnectionInfo', JSON.stringify(connectionInfo));
        } else {
          setIsBankConnected(false);
          localStorage.removeItem('bankConnected');
          localStorage.removeItem('bankConnectionInfo');
        }
      } catch (error) {
        console.error('Error checking bank connections:', error);
        
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const bankConnected = localStorage.getItem('bankConnected') === 'true';
          setIsBankConnected(bankConnected);
          
          const storedBankInfo = localStorage.getItem('bankConnectionInfo');
          if (storedBankInfo) {
            try {
              const parsedInfo = JSON.parse(storedBankInfo);
              setBankConnectionInfo(parsedInfo);
            } catch (e) {
              console.error('Error parsing bank connection info from localStorage');
            }
          }
        }
      }
    };
    
    checkBankConnections();
  }, []);

  // Function to call when bank is successfully connected
  const storeBankConnection = (bankName: string) => {
    setIsBankConnected(true);
    const connectionInfo = {
      name: bankName || 'Your Bank',
      connectedDate: new Date().toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric'
      })
    };
    setBankConnectionInfo(connectionInfo);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bankConnected', 'true');
      localStorage.setItem('bankConnectionInfo', JSON.stringify(connectionInfo));
    }
  };

  // Check for successful connection after drawer closes
  const handleBankDrawerClose = () => {
    setIsBankDrawerOpen(false);
    
    // Trigger a fresh check of bank connections from the database
    const checkBankConnections = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', user.id);
          
        if (!properties || properties.length === 0) return;
        
        const propertyIds = properties.map(p => p.id);
        
        const { data: connections } = await supabase
          .from('bank_connections')
          .select('property_id, created_at')
          .in('property_id', propertyIds.map(id => id.toString()));
          
        if (connections && connections.length > 0) {
          setIsBankConnected(true);
          
          const connectionDate = new Date(connections[0].created_at).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric'
          });
          
          const connectionInfo = {
            name: 'Connected Bank',
            connectedDate: connectionDate
          };
          
          setBankConnectionInfo(connectionInfo);
          localStorage.setItem('bankConnected', 'true');
          localStorage.setItem('bankConnectionInfo', JSON.stringify(connectionInfo));
        }
      } catch (error) {
        console.error('Error checking bank connections after drawer close:', error);
      }
    };
    
    checkBankConnections();
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">
              Integrations
            </Heading>
            <Text className="text-gray-500 mt-1">
              Connect ZenRent with your favorite tools and services.
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Messaging */}
          <Card className="cursor-pointer hover:border-blue-200 transition-colors"
            onClick={() => router.push('/settings/whatsapp')}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl">Messaging</CardTitle>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                  <CogIcon className="h-4 w-4 mr-1" />
                  Configure
                </span>
              </div>
              <CardDescription className="mt-1">
                WhatsApp messaging for tenants via ZenRent's central number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <Image src="/images/integrations/whatsapp.png"
                    alt="WhatsApp"
                    width={32}
                    height={32}
                    className="rounded mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      WhatsApp Business
                    </p>
                    <p className="text-xs text-gray-500">Centralized messaging</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline w-fit">
                  Settings
                </button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500 flex-wrap">
              Manage WhatsApp opt-in settings in your account preferences
            </CardFooter>
          </Card>

          {/* Bank Account */}
          <Card className="cursor-pointer hover:border-blue-200 transition-colors"
            onClick={() => setIsBankDrawerOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle className="text-xl">Bank Account</CardTitle>
                {isBankConnected ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Disconnected
                  </span>
                )}
              </div>
              <CardDescription className="mt-1">
                Connect your bank account for payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center">
                  <Wallet className={`w-8 h-8 rounded mr-2 ${isBankConnected ? '' : 'opacity-50'}`} />
                  <div>
                    {isBankConnected ? (
                      <>
                        <p className="text-sm font-medium">
                          {bankConnectionInfo.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Connected since {bankConnectionInfo.connectedDate}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-500">
                          Open Banking
                        </p>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </>
                    )}
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:underline w-fit">
                  {isBankConnected ? 'Configure' : 'Connect'}
                </button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 text-xs text-gray-500 flex-wrap">
              {isBankConnected 
                ? 'Bank account connected for automatic transaction syncing'
                : 'Enable direct bank payments and reconciliation'}
            </CardFooter>
          </Card>

          {/* Bank Account Drawer */}
          <BankAccountDrawer isOpen={isBankDrawerOpen}
            onClose={handleBankDrawerClose}
          />

          {/* Accounting Software Drawer */}
          <AccountingSoftwareDrawer isOpen={isAccountingDrawerOpen}
            onClose={() => setIsAccountingDrawerOpen(false)}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
