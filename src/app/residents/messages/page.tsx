'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { ChatWindow } from '../../components/ChatWindow'
import { TenantsByPropertyForMessages } from '../../components/TenantsByPropertyForMessages'
import { WhatsAppConnectionStatus } from '../../components/WhatsAppConnectionStatus'
import { useAuth } from '../../../lib/auth-provider'
import { getTenants } from '../../../lib/tenantService'
import { ITenant } from '../../../lib/propertyService'

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
}

interface Message {
  id: string
  from: 'user' | 'business'
  text: string
  timestamp: string
  status?: string
}

// Define tenant with UI specific properties
interface TenantWithUI extends ITenant {
  property_name: string;
  property_address?: string;
  property_id?: string;
  image: string;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
}

interface PropertyListItem {
  id: string;
  name: string;
}

interface WhatsAppAccount {
  waba_id: string;
  phone_number_id: string;
  phone_number: string;
  business_name: string;
  status: string;
}

export default function ResidentMessages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantWithUI[]>([]);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithUI | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [whatsAppAccount, setWhatsAppAccount] = useState<WhatsAppAccount | null>(null);

  // Fetch tenants when component mounts
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        let fetchedTenants: ITenant[] = [];
        
        if (user?.id) {
          fetchedTenants = await getTenants(user.id);
        }
        
        // Transform tenants for UI display
        const tenantsWithUI = fetchedTenants.map((tenant: ITenant) => ({
          ...tenant,
          image: tenant.image || getInitialsAvatar(tenant.name),
          property_name: tenant.property_address || 'Unassigned',
          // Only set unreadCount when there are actual unread messages
          unreadCount: undefined,
          lastMessage: Math.random() > 0.5 ? {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          } : undefined
        }));
        
        setTenants(tenantsWithUI);
        
        // Create unique property list from property_address
        const propertySet = new Set<string>();
        const propertyList: PropertyListItem[] = [];
        
        tenantsWithUI.forEach((tenant: TenantWithUI) => {
          if (tenant.property_address && !propertySet.has(tenant.property_address)) {
            propertySet.add(tenant.property_address);
            propertyList.push({
              id: tenant.property_address,
              name: tenant.property_address
            });
          }
        });
        
        setProperties(propertyList);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [user?.id]);

  // Check WhatsApp connection status
  useEffect(() => {
    const checkWhatsAppConnection = async () => {
      try {
        const response = await fetch('/api/whatsapp/connect');
        const data = await response.json();
        setIsWhatsAppConnected(data.connected || false);
        setWhatsAppAccount(data.account || null);
      } catch (error) {
        console.error('Error checking WhatsApp connection:', error);
        setIsWhatsAppConnected(false);
      }
    };
    
    checkWhatsAppConnection();
  }, []);

  // Fetch WhatsApp messages for selected tenant
  useEffect(() => {
    if (selectedTenant?.phone && isWhatsAppConnected) {
      fetchMessages(selectedTenant.phone);
    } else {
      setMessages([]);
    }
  }, [selectedTenant, isWhatsAppConnected]);

  const fetchMessages = async (phoneNumber: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send a message via WhatsApp
  const sendMessage = async (messageText: string) => {
    if (!selectedTenant?.phone || !messageText.trim() || !isWhatsAppConnected) {
      return;
    }
    
    try {
      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedTenant.phone,
          message: messageText,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the messages
        setMessages(prev => [...prev, data.message]);
        
        // Update the tenant's last message in the list
        setTenants(prevTenants => 
          prevTenants.map(tenant => 
            tenant.id === selectedTenant.id
              ? {
                  ...tenant,
                  lastMessage: {
                    text: messageText,
                    timestamp: new Date().toISOString()
                  },
                  unreadCount: 0 // Reset unread count when sending a message
                }
              : tenant
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle tenant selection
  const handleSelectTenant = (tenant: TenantWithUI) => {
    setSelectedTenant(tenant);
    
    // Clear the unread count when selecting a tenant
    if (tenant.unreadCount && tenant.unreadCount > 0) {
      setTenants(prevTenants => 
        prevTenants.map(t => 
          t.id === tenant.id
            ? { ...t, unreadCount: 0 }
            : t
        )
      );
    }
  };

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/residents" />}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">Resident Messages</Heading>
            <Text className="text-gray-500 mt-1">Communicate with your residents via WhatsApp</Text>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && tenants.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">No Residents</h3>
            <p className="mt-1 text-sm text-gray-500">You need to add residents before you can message them.</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && tenants.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Panel - Tenant List */}
            <div className="lg:col-span-1">
              <TenantsByPropertyForMessages
                tenants={tenants}
                properties={properties}
                selectedTenant={selectedTenant}
                onSelectTenant={handleSelectTenant}
              />
            </div>

            {/* Right Panel - Chat & Status */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              {/* WhatsApp Connection Status */}
              <WhatsAppConnectionStatus 
                isConnected={isWhatsAppConnected}
                phoneNumber={whatsAppAccount?.phone_number}
              />

              {/* Chat Window */}
              {selectedTenant ? (
                <div className="flex-1">
                  <ChatWindow
                    tenantName={selectedTenant.name}
                    tenantPhone={selectedTenant.phone || ''}
                    tenantImage={selectedTenant.image}
                    onSendMessage={sendMessage}
                    messages={messages}
                    isWhatsAppConnected={isWhatsAppConnected}
                    isLoadingMessages={isLoadingMessages}
                  />
                </div>
              ) : (
                <div className="flex-1 border border-gray-200 rounded-lg bg-white flex items-center justify-center">
                  <div className="text-center text-gray-500 p-6">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">No conversation selected</h3>
                    <p className="mt-1 text-sm">Select a tenant from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
} 