"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";

// Types for the centralized WhatsApp model
interface WhatsAppStatus {
  whatsapp_enabled: boolean;
  whatsapp_opted_in_at: string | null;
  whatsapp_notifications_enabled: boolean;
  landlord_id: string;
  landlord_name: string;
  tenant_count: number;
  tenants: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    property_address: string;
    lease_status: string;
  }>;
  system_configured: boolean;
  status_message: string;
  can_receive_messages: boolean;
  needs_tenants: boolean;
  can_enable: boolean;
}

export default function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current WhatsApp opt-in status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/whatsapp/opt-in-status');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access WhatsApp settings');
        }
        throw new Error(`Failed to fetch WhatsApp status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  };

  // Toggle WhatsApp opt-in status
  const toggleWhatsApp = async (enabled: boolean) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/whatsapp/toggle-opt-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to modify WhatsApp settings');
        }
        throw new Error(`Failed to update WhatsApp settings: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        // Refresh status to get updated data
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Failed to update WhatsApp settings');
      }
    } catch (err) {
      console.error('Error toggling WhatsApp:', err);
      setError(err instanceof Error ? err.message : 'Failed to update WhatsApp settings');
    } finally {
      setUpdating(false);
    }
  };

  // Load status on component mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <Heading level={1} className="text-2xl font-bold">
            WhatsApp Messaging
          </Heading>
          <Text className="text-gray-500 mt-1">
            Enable WhatsApp communication with your tenants through ZenRent's central number.
          </Text>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-sm text-red-700 font-medium underline hover:text-red-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && status && (
          <div className="space-y-6">
            {/* WhatsApp Toggle Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    status.whatsapp_enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${
                      status.whatsapp_enabled ? 'text-green-600' : 'text-gray-400'
                    }`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      WhatsApp Messaging
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {status.status_message}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => toggleWhatsApp(!status.whatsapp_enabled)}
                    disabled={updating || !status.can_enable}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      status.whatsapp_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        status.whatsapp_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  {updating && (
                    <div className="ml-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Details */}
              {status.whatsapp_enabled && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-semibold text-blue-700">{status.tenant_count}</div>
                      <div className="text-sm text-blue-600">Tenants with phone numbers</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-semibold text-green-700">
                        {status.can_receive_messages ? 'Active' : 'Setup Needed'}
                      </div>
                      <div className="text-sm text-green-600">Messaging status</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-semibold text-purple-700">
                        {status.whatsapp_opted_in_at ? new Date(status.whatsapp_opted_in_at).toLocaleDateString() : 'Today'}
                      </div>
                      <div className="text-sm text-purple-600">Enabled on</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* How It Works Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How WhatsApp Messaging Works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Centralized Number</h4>
                    <p className="text-sm text-gray-600">
                      All WhatsApp messages are sent and received through ZenRent's central WhatsApp Business number.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Message Attribution</h4>
                    <p className="text-sm text-gray-600">
                      Messages you send will include your name: <br />
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        "{status.landlord_name} via ZenRent: Your message here"
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Automatic Routing</h4>
                    <p className="text-sm text-gray-600">
                      Tenant replies are automatically routed to you based on their phone number in your tenant records.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant List Section */}
            {status.whatsapp_enabled && status.tenant_count > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  WhatsApp-Enabled Tenants ({status.tenant_count})
                </h3>
                <div className="space-y-3">
                  {status.tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-600">{tenant.property_address}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{tenant.phone}</div>
                        <div className="text-xs text-gray-500">{tenant.lease_status} lease</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Section */}
            {status.needs_tenants && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Add Tenants to Start Messaging</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        WhatsApp messaging is enabled, but you don't have any tenants with phone numbers. 
                        Add tenants to your properties to start receiving WhatsApp messages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            {!status.system_configured && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">System Configuration Required</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        WhatsApp integration is not fully configured on the system level. 
                        Please contact support or ensure the WhatsApp credentials are properly set.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}