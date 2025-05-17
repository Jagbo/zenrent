"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "../../components/sidebar-layout";
import { SidebarContent } from "../../components/sidebar-content";
import { Heading } from "../../components/heading";
import { Text } from "../../components/text";

// Define types for WhatsApp integration
interface WhatsAppIntegration {
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  status: string;
  connectedAt: string;
}

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}

// Facebook SDK types
type FacebookSDK = {
  init: (params: { 
    appId: string; 
    version: string;
    cookie?: boolean; 
    xfbml?: boolean;
  }) => void;
  login: (callback: (response: any) => void, options: {
    config_id: string;
    auth_type: string;
    response_type: string;
    override_default_response_type: boolean;
    extras: { 
      sessionInfoVersion: number;
      business_verification_override?: boolean;
      enforce_permission_review_override?: boolean;
      dev_mode_override?: boolean;
      skip_app_review_override?: boolean;
      business_onboarding_override?: boolean;
      test_mode?: boolean;
    };
  }) => void;
};

// Add Window interface extension
declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

export default function WhatsAppIntegration() {
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [pin, setPin] = useState<string>("");
  const [testMessage, setTestMessage] = useState<string>("");
  const [testNumber, setTestNumber] = useState<string>("");

  // Helper to add logs with timestamps
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Check if WhatsApp is already connected
  useEffect(() => {
    const checkIntegration = async () => {
      try {
        setLoading(true);
        addLog('Checking WhatsApp integration status...');
        
        const response = await fetch('/api/whatsapp/setup');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        addLog('WhatsApp setup response received');
        
        // Log success or failure
        if (data.success) {
          addLog('WhatsApp subscription successful');
        } else {
          addLog(`WhatsApp setup failed: ${data.error || 'Unknown error'}`);
          setError('Failed to set up WhatsApp integration');
        }
        
        // Get phone numbers
        if (data.phones && data.phones.data && data.phones.data.length > 0) {
          setPhoneNumbers(data.phones.data);
          
          // Set first phone number as selected by default
          if (data.phones.data[0].id) {
            setSelectedPhoneId(data.phones.data[0].id);
          }
          
          // Create the integration object
          const firstPhone = data.phones.data[0];
          setIntegration({
            wabaId: '596136450071721', // WABA ID
            phoneId: firstPhone.id,
            phoneNumber: firstPhone.display_phone_number,
            status: 'Connected',
            connectedAt: new Date().toISOString()
          });
          
          addLog(`Found ${data.phones.data.length} phone numbers`);
        } else {
          addLog('No phone numbers found');
        }
      } catch (err) {
        console.error('Error checking WhatsApp integration:', err);
        addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setError(`Failed to check WhatsApp integration: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    checkIntegration();
  }, []);

  // Register phone with PIN
  const registerPhone = async () => {
    try {
      setRegistering(true);
      addLog(`Registering phone ${selectedPhoneId} with PIN...`);
      
      const response = await fetch('/api/whatsapp/register-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: selectedPhoneId,
          pin: pin
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog('Phone registered successfully');
        setPin("");
      } else {
        addLog(`Registration failed: ${data.error || 'Unknown error'}`);
        setError(`Failed to register phone: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error registering phone:', err);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setError(`Failed to register phone: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRegistering(false);
    }
  };

  // Send test message
  const sendTestMessage = async () => {
    try {
      setSendingMessage(true);
      addLog(`Sending test message to ${testNumber}...`);
      
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: selectedPhoneId,
          to: testNumber,
          message: testMessage
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addLog(`Message sent successfully! ID: ${data.messageId}`);
        setTestMessage("");
      } else {
        addLog(`Message sending failed: ${data.error || 'Unknown error'}`);
        setError(`Failed to send message: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath="/settings/whatsapp" />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <Heading level={1} className="text-2xl font-bold">
            WhatsApp Integration
          </Heading>
          <Text className="text-gray-500 mt-1">
            Connect your WhatsApp Business Account to communicate with tenants directly.
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

        {/* Main Content */}
        {!loading && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {integration ? (
              // WhatsApp Connected State
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">WhatsApp Connected</h2>
                      <p className="text-sm text-gray-500">Your WhatsApp Business Account is active</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium mb-4">Phone Numbers</h3>
                  
                  {phoneNumbers.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="border border-gray-200 rounded-md p-4">
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Select Phone Number
                          </label>
                          <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={selectedPhoneId}
                            onChange={(e) => setSelectedPhoneId(e.target.value)}
                          >
                            {phoneNumbers.map((phone) => (
                              <option key={phone.id} value={phone.id}>
                                {phone.display_phone_number} - {phone.verified_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Phone Registration Form */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="text-md font-medium mb-2">Register Phone (Two-Factor Authentication)</h4>
                          <p className="text-sm text-gray-500 mb-4">
                            You must set a 6-digit PIN to register your phone number with WhatsApp
                          </p>
                          <div className="flex space-x-4">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="6-digit PIN"
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={registerPhone}
                              disabled={!pin || pin.length !== 6 || registering}
                              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                !pin || pin.length !== 6 || registering
                                  ? 'bg-blue-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {registering ? 'Registering...' : 'Register'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Test Message Form */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="text-md font-medium mb-2">Send Test Message</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block mb-1 text-sm font-medium text-gray-700">
                                Recipient Phone Number (with country code)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., 447911123456"
                                value={testNumber}
                                onChange={(e) => setTestNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-sm font-medium text-gray-700">
                                Message
                              </label>
                              <textarea
                                placeholder="Your test message"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={sendTestMessage}
                                disabled={!testNumber || !testMessage || sendingMessage}
                                className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                  !testNumber || !testMessage || sendingMessage
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {sendingMessage ? 'Sending...' : 'Send Test Message'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No phone numbers found for your WhatsApp Business Account</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Not Connected State
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">WhatsApp Not Connected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your WhatsApp Business Account is not connected. Click the button below to refresh and try again.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh Connection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Debug Logs Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Logs</h3>
          <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet.</div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}