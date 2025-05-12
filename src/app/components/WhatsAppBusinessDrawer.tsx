"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { BaseDrawer } from "./BaseDrawer";

// Define the WhatsAppBusinessDrawer props interface
export interface WhatsAppBusinessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
      login: (callback: (response: unknown) => void, options: unknown) => void;
    };
  }
}

export const WhatsAppBusinessDrawer: React.FC<WhatsAppBusinessDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  // Initialize Facebook SDK on component mount
  useEffect(() => {
    // Load the Facebook SDK asynchronously
    const loadFacebookSDK = () => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "953206047023164", // Your Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
      };

      // Load the SDK asynchronously
      (function (d, s, id) {
        const element = d.getElementsByTagName(s)[0];
        const fjs = element as HTMLElement;
        if (d.getElementById(id)) return;
        const js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        if (fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      })(document, "script", "facebook-jssdk");
    };

    loadFacebookSDK();

    // Setup listener for WhatsApp embedded signup messages
    const embeddedSignupListener = (event: MessageEvent) => {
      console.log("Received event from:", event.origin, "data:", typeof event.data);
      
      if (!event.origin.includes("facebook.com")) return;

      try {
        const data = JSON.parse(event.data);
        console.log("Parsed event data:", data);

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("Received WhatsApp signup event:", data);

          if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
            const { waba_id, phone_number_id } = data.data;
            console.log("WhatsApp setup complete:", waba_id, phone_number_id);

            // Store the IDs and complete onboarding
            setWabaId(waba_id);
            setPhoneNumberId(phone_number_id || "");
            storeWabaConnection(waba_id, phone_number_id);
            setStep(3);
            setIsLoading(false);
          } else if (data.event === "CANCEL") {
            console.warn(
              "User canceled WhatsApp onboarding at step",
              data.data.current_step,
            );
            setError("WhatsApp setup was canceled.");
            setIsLoading(false);
          } else if (data.event === "ERROR") {
            console.error(
              "Error during WhatsApp onboarding:",
              data.data.error_message,
            );
            setError(`Error: ${data.data.error_message}`);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.log("Received non-JSON message from origin", event.origin, ":", event.data);
      }
    };

    window.addEventListener("message", embeddedSignupListener);

    // Cleanup listener on unmount
    return () => window.removeEventListener("message", embeddedSignupListener);
  }, []);

  // Check environment variables when drawer opens
  useEffect(() => {
    if (isOpen) {
      console.log("WhatsApp drawer opened, checking environment variables");
      
      // Check the environment variables via API
      fetch('/api/env-check')
        .then(response => response.json())
        .then(data => {
          console.log("Environment check:", data);
          if (data && data.success && data.env) {
            if (!data.env.NEXT_PUBLIC_FB_CONFIG_ID) {
              console.warn("NEXT_PUBLIC_FB_CONFIG_ID is not set in environment");
            }
          } else {
            console.warn("Invalid response format from environment check API");
          }
        })
        .catch(error => {
          console.error("Error checking environment:", error);
        });
    }
  }, [isOpen]);

  // Check if the user already has a WhatsApp integration
  const checkExistingIntegration = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/whatsapp/setup");
      const data = await response.json();
      
      if (data.success && data.phones && data.phones.data && data.phones.data.length > 0) {
        // We already have a WhatsApp integration
        console.log("Found existing WhatsApp integration:", data);
        
        const phoneDetails = data.phones.data[0];
        setPhoneNumber(phoneDetails.display_phone_number || "");
        // Use dummy WABA ID if not provided in the response
        setWabaId(data.wabaId || "existing-waba");
        setPhoneNumberId(phoneDetails.id || "");
        setConnectionStatus("connected");
        setStep(3);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking existing integration:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing integration when the drawer opens
  useEffect(() => {
    if (isOpen) {
      checkExistingIntegration();
    }
  }, [isOpen]);

  // Initiate WhatsApp Embedded Signup
  const initiateWhatsAppSignup = async () => {
    // First check if there's already an integration
    const hasExisting = await checkExistingIntegration();
    if (hasExisting) {
      return; // Already set up, no need to continue
    }
    
    setIsLoading(true);
    setError("");

    try {
      // Log for debugging
      console.log("Environment variables available:", {
        NEXT_PUBLIC_FB_CONFIG_ID: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
        hasWindow: typeof window !== 'undefined'
      });
      
      const configId = process.env.NEXT_PUBLIC_FB_CONFIG_ID;
      console.log("CONFIG ID:", configId);
      
      if (!configId) {
        throw new Error("Missing config ID in environment variables");
      }
      
      // URL Parameters for direct navigation to Facebook OAuth
      const params = new URLSearchParams({
        app_id: "953206047023164",
        config_id: configId,
        redirect_uri: window.location.origin + "/integrations",
        response_type: "code",
        state: JSON.stringify({userId: 'current_user', timestamp: Date.now()}),
        scope: 'whatsapp_business_management,business_management',
        extras: JSON.stringify({
          sessionInfoVersion: 3,
          featureType: "whatsapp_embedded_signup",
          flow_type: "merchant_managed"
        })
      });
      
      // Open the WhatsApp for Business signup flow in a new window
      const signupWindow = window.open(
        `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`,
        'whatsapp_signup',
        'width=800,height=600'
      );
      
      if (!signupWindow) {
        throw new Error("Popup window was blocked. Please allow popups for this site and try again.");
      }
      
      // Set a timeout to check if the window was closed
      const checkWindowClosed = setInterval(() => {
        if (signupWindow.closed) {
          clearInterval(checkWindowClosed);
          console.log("Signup window was closed by user");
          setIsLoading(false);
          // We'll check for integration after window closes
          checkExistingIntegration();
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error initiating WhatsApp signup:", err);
      setError("Failed to start WhatsApp setup: " + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  };

  // Store the WABA connection in your system
  const storeWabaConnection = async (wabaId: string, phoneNumberId: string | null) => {
    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wabaId }),
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus("connected");

        // If the response includes the phone number, store it
        if (data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
        }
      } else {
        setError(data.error || "Failed to store WhatsApp connection");
      }
    } catch (error) {
      console.error("Error storing WhatsApp connection:", error);
      setError("Failed to save your WhatsApp connection. Please try again.");
    }
  };

  // Content to display inside the drawer
  const renderContent = () => {
    if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              WhatsApp Business Connected!
            </h3>
            <p className="text-sm text-gray-500">
              Your WhatsApp Business account has been successfully connected
            </p>
          </div>

          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">
                WhatsApp Business account connected successfully
              </p>
            </div>
            {phoneNumber && (
              <p className="mt-2 text-xs text-gray-600">Phone: {phoneNumber}</p>
            )}
            {wabaId && (
              <p className="mt-2 text-xs text-gray-600">WABA ID: {wabaId}</p>
            )}
          </div>

          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Connect WhatsApp Business</h3>
          <p className="text-sm text-gray-500">
            Follow these steps to integrate WhatsApp Business API
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                1
              </span>
              <span className="font-medium">
                Connect your WhatsApp Business account
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 ml-8">
              You'll be redirected to Meta to authorize access to your WhatsApp
              Business account
            </p>
          </div>

          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">
                2
              </span>
              <span className="font-medium">Verify your business</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 ml-8">
              Verify your business to unlock full messaging capabilities
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button className="w-full"
          onClick={initiateWhatsAppSignup}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect WhatsApp Business"}
        </Button>
      </div>
    );
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Business"
      width="md"
    >
      {isLoading ? (
        <div className="flex flex-col items-center space-y-3 py-12">
          <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Processing your request...</p>
        </div>
      ) : (
        renderContent()
      )}
    </BaseDrawer>
  );
};
