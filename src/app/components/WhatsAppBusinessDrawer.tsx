'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { BaseDrawer } from './BaseDrawer'

// Define the WhatsAppBusinessDrawer props interface
export interface WhatsAppBusinessDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// Define the interface for window with Facebook SDK
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
  }
}

export const WhatsAppBusinessDrawer: React.FC<WhatsAppBusinessDrawerProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [wabaId, setWabaId] = useState('')

  // Initialize Facebook SDK on component mount
  useEffect(() => {
    // Load the Facebook SDK asynchronously
    const loadFacebookSDK = () => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };

      // Load the SDK asynchronously
      (function(d, s, id) {
        const element = d.getElementsByTagName(s)[0];
        const fjs = element as HTMLElement;
        if (d.getElementById(id)) return;
        const js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        if (fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, []);

  // Initiate WhatsApp Embedded Signup
  const initiateWhatsAppSignup = () => {
    setIsLoading(true);
    
    // Check if we're in development mode (localhost)
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevelopment) {
      console.log('Development mode detected - simulating WhatsApp signup');
      // Simulate a successful connection in development mode
      setTimeout(() => {
        const mockWabaId = 'dev_waba_' + Math.random().toString(36).substring(2, 15);
        setWabaId(mockWabaId);
        storeWabaConnection(mockWabaId, 'dev_code');
        setStep(3);
        setIsLoading(false);
      }, 1500);
      return;
    }
    
    // Production implementation - use Facebook SDK
    if (typeof window.FB === 'undefined') {
      console.error('Facebook SDK not loaded');
      setIsLoading(false);
      return;
    }
    
    // Login with Facebook to get permissions
    window.FB.login(function(response) {
      if (response.authResponse) {
        // Use the Embedded Signup flow
        window.FB.WhatsAppSignup.initiateWhatsAppSignup({
          success_url: window.location.origin + '/integrations/whatsapp-success',
          business_id: undefined, // Let the user select their business
          extras: {
            setup: {
              platform: 'BUSINESS',
              website: window.location.origin
            }
          },
          callback: function(data: { waba_id?: string; code?: string }) {
            // Handle the callback after signup
            console.log('WhatsApp signup complete', data);
            if (data.waba_id) {
              setWabaId(data.waba_id);
              // Store the WABA ID in your system
              storeWabaConnection(data.waba_id, data.code || '');
              setStep(3);
            }
            setIsLoading(false);
          }
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
        setIsLoading(false);
      }
    }, {scope: 'whatsapp_business_management,business_management'});
  };
  
  // Store the WABA connection in your system
  const storeWabaConnection = async (wabaId: string, code: string) => {
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wabaId, code }),
      });
      
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error storing WhatsApp connection:', error);
    }
  };

  // Content to display inside the drawer
  const renderContent = () => {
    if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">WhatsApp Business Connected!</h3>
            <p className="text-sm text-gray-500">Your WhatsApp Business account has been successfully connected</p>
          </div>
  
          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">WhatsApp Business account connected successfully</p>
            </div>
            {wabaId && (
              <p className="mt-2 text-xs text-gray-600">WABA ID: {wabaId}</p>
            )}
          </div>
  
          <Button className="w-full" onClick={() => window.location.reload()}>
            Done
          </Button>
        </div>
      );
    }
  
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
              <span className="font-medium">Connect your WhatsApp Business account</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 ml-8">
              You'll be redirected to Meta to authorize access to your WhatsApp Business account
            </p>
          </div>
  
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">2</span>
              <span className="font-medium">Verify your business</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 ml-8">
              Verify your business to unlock full messaging capabilities
            </p>
          </div>
        </div>
  
        <Button 
          className="w-full" 
          onClick={initiateWhatsAppSignup}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect WhatsApp Business'}
        </Button>
      </div>
    );
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Connect WhatsApp Business"
      width="md"
      blurIntensity="md"
      overlayOpacity="light"
    >
      {renderContent()}
    </BaseDrawer>
  );
}; 