"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";
import { ChatWindow } from "../../components/ChatWindow";
import { TenantsByPropertyForMessages } from "../../components/TenantsByPropertyForMessages";
import { WhatsAppConnectionStatus } from "../../components/WhatsAppConnectionStatus";
import { useAuth } from "../../../lib/auth-provider";
import { getTenants } from "../../../lib/tenantService";
import { ITenant } from "../../../lib/propertyService";
import { withRetry, showErrorToast, showSuccessToast } from "../../../lib/utils/errorHandling";

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
};

interface Message {
  id: string;
  from: "user" | "business";
  text: string;
  timestamp: string;
  status?: string;
  messageId?: string;
  messageType?: string;
  mediaUrl?: string;
  deliveredAt?: string;
  readAt?: string;
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

interface WhatsAppOptInStatus {
  whatsapp_enabled: boolean;
  whatsapp_opted_in_at: string | null;
  whatsapp_notifications_enabled: boolean;
  landlord_id: string;
  landlord_name: string;
  tenant_count: number;
  system_configured: boolean;
  status_message: string;
}

export default function ResidentMessages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantWithUI[]>([]);
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithUI | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppOptInStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Fetch tenants when component mounts
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        let fetchedTenants: ITenant[] = [];

        if (user?.id) {
          fetchedTenants = await withRetry(() => getTenants(user.id));
        }

        // Transform tenants for UI display
        const tenantsWithUI = fetchedTenants.map((tenant: ITenant) => ({
          ...tenant,
          image: tenant.image || getInitialsAvatar(tenant.name),
          property_name: tenant.property_address || "Unassigned",
          // Don't set any dummy data - will be populated from real WhatsApp messages
          unreadCount: undefined,
          lastMessage: undefined,
        }));

        setTenants(tenantsWithUI);

        // Create unique property list from property_address
        const propertySet = new Set<string>();
        const propertyList: PropertyListItem[] = [];

        tenantsWithUI.forEach((tenant: TenantWithUI) => {
          if (
            tenant.property_address &&
            !propertySet.has(tenant.property_address)
          ) {
            propertySet.add(tenant.property_address);
            propertyList.push({
              id: tenant.property_address,
              name: tenant.property_address,
            });
          }
        });

        setProperties(propertyList);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        setError("Failed to load tenants. Please try again.");
        showErrorToast("Failed to load tenants");
        setTenants([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [user?.id]);

  // Check WhatsApp opt-in status (centralized model)
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const response = await withRetry(() => fetch("/api/whatsapp/opt-in-status"));
        const data = await response.json();
        
        if (response.ok) {
          setWhatsAppStatus(data);
          setIsWhatsAppConnected(data.whatsapp_enabled && data.system_configured);
        } else {
          console.error("Error checking WhatsApp status:", data);
          setIsWhatsAppConnected(false);
          setWhatsAppStatus(null);
        }
      } catch (error) {
        console.error("Error checking WhatsApp status:", error);
        setIsWhatsAppConnected(false);
        setWhatsAppStatus(null);
      }
    };

    if (user?.id) {
      checkWhatsAppStatus();
    }
  }, [user?.id]);

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
    setMessageError(null);
    try {
      const response = await withRetry(() =>
        fetch(`/api/whatsapp/messages?phone=${encodeURIComponent(phoneNumber)}`)
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success && data.messages) {
        setMessages(data.messages);
        
        // Update the tenant's last message if there are messages
        if (data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          setTenants((prevTenants) =>
            prevTenants.map((tenant) =>
              tenant.id === selectedTenant?.id
                ? {
                    ...tenant,
                    lastMessage: {
                      text: lastMessage.text,
                      timestamp: lastMessage.timestamp,
                    },
                  }
                : tenant,
            ),
          );
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      setMessageError("Failed to load messages. Please try again.");
      showErrorToast("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send a message via WhatsApp (centralized model)
  const sendMessage = async (messageText: string) => {
    if (!selectedTenant?.phone || !messageText.trim() || !isWhatsAppConnected) {
      return;
    }

    try {
      const response = await withRetry(() =>
        fetch("/api/whatsapp/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selectedTenant.phone,
            message: messageText,
          }),
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the messages
        setMessages((prev) => [...prev, data.message]);

        // Update the tenant's last message in the list
        setTenants((prevTenants) =>
          prevTenants.map((tenant) =>
            tenant.id === selectedTenant.id
              ? {
                  ...tenant,
                  lastMessage: {
                    text: messageText,
                    timestamp: new Date().toISOString(),
                  },
                  unreadCount: 0, // Reset unread count when sending a message
                }
              : tenant,
          ),
        );
        
        showSuccessToast("Message sent successfully");
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      showErrorToast(errorMessage);
    }
  };

  // Handle tenant selection
  const handleSelectTenant = (tenant: TenantWithUI) => {
    setSelectedTenant(tenant);

    // Clear the unread count when selecting a tenant
    if (tenant.unreadCount && tenant.unreadCount > 0) {
      setTenants((prevTenants) =>
        prevTenants.map((t) =>
          t.id === tenant.id ? { ...t, unreadCount: 0 } : t,
        ),
      );
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold">
              Resident Messages
            </Heading>
            <Text className="text-gray-500 mt-1">
              Communicate with your residents via WhatsApp through ZenRent's central number
            </Text>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading tenants</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 rounded-md"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tenants.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-cabinet-grotesk-bold text-gray-900">
              No Residents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to add residents before you can message them.
            </p>
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
                phoneNumber={whatsAppStatus?.system_configured ? "ZenRent Central Number" : undefined}
              />

              {/* Chat Window */}
              {selectedTenant ? (
                <div className="flex-1">
                  <ChatWindow 
                    tenantName={selectedTenant.name}
                    tenantPhone={selectedTenant.phone || ""}
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
                    <svg className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium">
                      No conversation selected
                    </h3>
                    <p className="mt-1 text-sm">
                      Select a tenant from the list to start messaging
                    </p>
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
