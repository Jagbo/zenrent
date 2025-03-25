'use client'

import { useParams } from 'next/navigation'
import { SidebarLayout } from '../../components/sidebar-layout'
import { SidebarContent } from '../../components/sidebar-content'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Link } from '../../../components/link'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { ResidentFormDrawer } from '../../components/ResidentFormDrawer'
import { getTenantWithLease } from '../../../lib/tenantService'
import { ITenantWithLease } from '../../../lib/tenantService'

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
}

export default function ResidentDetails() {
  const params = useParams()
  const residentId = params.id as string
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [tenant, setTenant] = useState<ITenantWithLease | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New state for WhatsApp integration
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Fetch tenant data when component mounts
  useEffect(() => {
    const fetchTenant = async () => {
      setLoading(true);
      try {
        const tenantData = await getTenantWithLease(residentId);
        setTenant(tenantData);
      } catch (error) {
        console.error(`Error fetching tenant ${residentId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [residentId]);

  // Check WhatsApp connection status
  useEffect(() => {
    const checkWhatsAppConnection = async () => {
      try {
        const response = await fetch('/api/whatsapp/connect');
        const data = await response.json();
        setIsWhatsAppConnected(Object.keys(data.connections || {}).length > 0);
      } catch (error) {
        console.error('Error checking WhatsApp connection:', error);
      }
    };
    
    checkWhatsAppConnection();
  }, []);

  // Fetch WhatsApp messages
  useEffect(() => {
    if (tenant?.phone && isWhatsAppConnected) {
      fetchWhatsAppMessages();
    }
  }, [tenant?.phone, isWhatsAppConnected]);

  const fetchWhatsAppMessages = async () => {
    if (!tenant?.phone) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(tenant.phone)}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send a message via WhatsApp
  const sendMessage = async () => {
    if (!messageInput.trim() || !tenant?.phone) return;
    
    try {
      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: tenant.phone,
          message: messageInput,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new message to the list and clear input
        setMessages(prev => [...prev, data.message]);
        setMessageInput('');
        // Fetch the updated message list
        setTimeout(fetchWhatsAppMessages, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Connect to WhatsApp
  const connectWhatsApp = () => {
    setIsConnecting(true);
    
    // In a real implementation, this would redirect to the WhatsApp authorization flow
    // For now, we'll simulate a successful connection after a delay
    setTimeout(() => {
      setIsWhatsAppConnected(true);
      setIsConnecting(false);
      // Initialize the message list with sample data
      fetchWhatsAppMessages();
    }, 1500);
  };

  const handleEditClick = () => {
      setIsEditDrawerOpen(true);
  };

  const handleSubmit = (formData: any) => {
    // Here you would typically save the resident details to your backend
    console.log('Updated resident:', formData);
    setIsEditDrawerOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <SidebarLayout
        sidebar={<SidebarContent currentPath="/residents" />}
      >
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    );
  }

  // Not found state
  if (!tenant) {
    return (
      <SidebarLayout
        sidebar={<SidebarContent currentPath="/residents" />}
      >
        <div className="space-y-6">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Dashboard</Link>
            <span className="mx-2">/</span>
            <Link href="/residents" className="hover:text-gray-700">Residents</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Not Found</span>
          </div>
          <div className="text-center py-12">
            <h3 className="text-base font-semibold text-gray-900">Resident not found</h3>
            <p className="mt-1 text-sm text-gray-500">The resident you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  // Define sample attachments for the tenant
  const attachments = [
    { name: 'lease_agreement.pdf', size: '1.2mb' },
    { name: 'tenant_application.pdf', size: '2.8mb' }
  ];

  return (
    <SidebarLayout
      sidebar={<SidebarContent currentPath="/residents" />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4">
          <Heading level={1} className="text-xl font-semibold">Resident Details</Heading>
        </div>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={tenant.image || getInitialsAvatar(tenant.name)}
              alt={tenant.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <Heading level={1} className="text-2xl font-bold">{tenant.name}</Heading>
              <Text className="text-gray-500 mt-1">
                {tenant.property_address ? 
                  `${tenant.property_address}, ${tenant.property_city}` : 
                  'No property assigned'}
              </Text>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]"
            >
              Edit Resident
            </button>
          </div>
        </div>

        {/* ResidentFormDrawer */}
        <ResidentFormDrawer
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          onSubmit={handleSubmit}
          properties={[{ id: tenant.lease?.property_uuid || '', name: tenant.property_address || '' }]}
          title="Edit Resident"
          initialData={tenant}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tenant Information */}
          <div className="col-span-2 overflow-hidden bg-white shadow-sm sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Tenant Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and lease information.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{tenant.name}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{tenant.email}</dd>
                </div>
                {tenant.phone && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{tenant.phone}</dd>
                  </div>
                )}
                {tenant.lease && tenant.lease.lease_start && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Lease start date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {new Date(tenant.lease.lease_start).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {tenant.lease && tenant.lease.lease_end && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Lease end date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {new Date(tenant.lease.lease_end).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {tenant.lease && tenant.lease.rent_amount && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Rent amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      £{tenant.lease.rent_amount.toLocaleString()}
                    </dd>
                  </div>
                )}
                {tenant.about && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">About</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {tenant.about}
                    </dd>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <ul role="list" className="divide-y divide-gray-200 rounded-md border border-gray-200">
                      {attachments.map((attachment, index) => (
                        <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                          <div className="flex w-0 flex-1 items-center">
                            <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            <span className="ml-2 w-0 flex-1 truncate">{attachment.name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                              Download
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Communication Panel */}
          <div className="col-span-1 overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Communication</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Connect with the tenant.</p>
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="space-y-4">
                {/* WhatsApp Integration */}
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.135-.272-.21-.572-.345z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.553 4.09 1.519 5.813L.051 24 6.38 22.549C8.095 23.488 10.03 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.786 0-3.518-.523-5-1.513l-.357-.214-3.746 1.003.983-3.685-.239-.377C2.589 15.522 2 13.807 2 12c0-5.522 4.477-10 10-10s10 4.478 10 10-4.477 10-10 10z"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">WhatsApp</h3>
                      {isWhatsAppConnected ? (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Connected to WhatsApp</p>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => window.open(`https://wa.me/${tenant.phone}`)}
                              className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                            >
                              Open Chat
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Connect to WhatsApp to message the tenant directly.</p>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={connectWhatsApp}
                              disabled={isConnecting}
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                isConnecting 
                                  ? 'bg-gray-100 text-gray-400 ring-gray-300/20' 
                                  : 'bg-green-50 text-green-700 ring-green-600/20'
                              }`}
                            >
                              {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Email Contact */}
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Email</h3>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Send an email to the tenant.</p>
                        <div className="mt-2">
                          <a
                            href={`mailto:${tenant.email}`}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                          >
                            Send Email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Call Button */}
                {tenant.phone && (
                  <div className="rounded-md bg-gray-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Call</h3>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Call the tenant directly.</p>
                          <div className="mt-2">
                            <a
                              href={`tel:${tenant.phone}`}
                              className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                            >
                              Call Tenant
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}