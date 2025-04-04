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
      if (!event.origin.includes("facebook.com")) return;

      try {
        const data = JSON.parse(event.data);

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
        console.log("Received non-JSON message");
      }
    };

    window.addEventListener("message", embeddedSignupListener);

    // Cleanup listener on unmount
    return () => window.removeEventListener("message", embeddedSignupListener);
  }, []);

  // Initiate WhatsApp Embedded Signup
  const initiateWhatsAppSignup = () => {
    setIsLoading(true);
    setError("");

    // Production implementation - use Facebook SDK
    if (typeof window.FB === "undefined") {
      console.error("Facebook SDK not loaded");
      setError("Facebook SDK failed to load. Please try again.");
      setIsLoading(false);
      return;
    }

    // Login with Facebook to get permissions
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          console.log("Facebook login successful, starting WhatsApp signup");

          // Use the Embedded Signup flow with configuration ID
          window.FB.login(
            (response) => {
              console.log("FB login response with config", response);
              // We will handle the post-login via event listener
              setIsLoading(false);
            },
            {
              config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID, // Your WhatsApp config ID
              auth_type: "rerequest",
              response_type: "code",
              override_default_response_type: true,
              extras: { sessionInfoVersion: 3 },
            },
          );
        } else {
          console.log("User cancelled login or did not fully authorize.");
          setError(
            "Facebook login was canceled. Authorization is required to setup WhatsApp.",
          );
          setIsLoading(false);
        }
      },
      {
        scope: "whatsapp_business_management,business_management",
        auth_type: "rerequest",
      },
    );
  };

  // Store the WABA connection in your system
  const storeWabaConnection = async (wabaId: string, phoneNumberId: string) => {
    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wabaId, phoneNumberId }),
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
    <BaseDrawer isOpen={isOpen}
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
