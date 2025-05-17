"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, BuildingOfficeIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { BaseDrawer } from "./BaseDrawer";
import { cn } from "@/lib/utils";

// Define the BankAccountDrawer props interface
export interface BankAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the interface for window with Plaid
declare global {
  interface Window {
    Plaid?: {
      create: (config: unknown) => {
        open: () => void;
      };
    };
  }
}

export const BankAccountDrawer: React.FC<BankAccountDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get properties from the properties array
  const properties = [
    { id: "123-main", name: "123 Main Street" },
    { id: "456-park", name: "456 Park Avenue" },
    { id: "789-ocean", name: "789 Ocean Drive" },
    { id: "321-victoria", name: "321 Victoria Road" },
    { id: "654-royal", name: "654 Royal Crescent" },
    { id: "987-kings", name: "987 Kings Road" },
  ];

  useEffect(() => {
    // Create a Plaid Link token when component mounts
    const createLinkToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country_codes: ["GB"],
            language: "en",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create Plaid Link token");
        }

        setPlaidLinkToken(data.link_token);
      } catch (error: unknown) {
        console.error("Error creating Plaid Link token:", error);
        setError(
          error.message ||
            "Failed to create Plaid Link token. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      createLinkToken();
    }
  }, [isOpen]);

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedProperty) {
        throw new Error("No property selected");
      }

      // Exchange public token for access token
      const response = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_token: publicToken,
          property_id: selectedProperty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          data.details?.error_message ||
          data.error ||
          "Failed to exchange token";
        throw new Error(errorMsg);
      }

      // Move to success step
      setStep(3);
    } catch (error: unknown) {
      console.error("Error exchanging Plaid token:", error);
      setError(
        error.message || "Failed to connect bank account. Please try again.",
      );
      setStep(1); // Reset to first step on error
    } finally {
      setIsLoading(false);
    }
  };

  // Reset drawer state when closed
  const handleClose = () => {
    onClose();
    // Reset state after drawer closes
    setTimeout(() => {
      setStep(1);
      setSelectedProperty(null);
      setError(null);
    }, 300);
  };

  // Content to display inside the drawer
  const renderContent = () => {
    // Show error message if there is one
    if (error) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Error</h3>
            <p className="text-sm text-gray-500">
              There was a problem connecting your bank account
            </p>
          </div>

          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>

          <Button className="w-full"
            onClick={() => {
              setError(null);
              setStep(1);
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Select Property</h3>
            <p className="text-sm text-gray-500">
              Choose which property this bank account is for
            </p>
          </div>

          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id}
                onClick={() => {
                  setSelectedProperty(property.id);
                  setStep(2);
                }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border cursor-pointer",
                  selectedProperty === property.id
                    ? "border-[#D9E8FF] bg-[#D9E8FF]/5"
                    : "border-gray-200 hover:border-indigo-300",
                )}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {property.name}
                    </p>
                  </div>
                </div>
                <input type="radio"
                  checked={selectedProperty === property.id}
                  onChange={() => {}}
                  className="h-4 w-4 text-gray-900 border-gray-300 focus:ring-[#D9E8FF]"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (step === 2) {
      if (!plaidLinkToken || isLoading) {
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Connect Your Bank</h3>
              <p className="text-sm text-gray-500">
                Loading bank connection...
              </p>
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
            <p className="text-sm text-gray-500">
              Securely connect your bank account using Plaid
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm">
                You'll be redirected to your bank's secure login page to
                authorize access
              </p>
            </div>

            <Button className="w-full"
              onClick={() => {
                if (typeof window.Plaid === "undefined") {
                  console.error("Plaid script not loaded");
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
                    console.log("User exited Plaid Link");
                  },
                  onEvent: (eventName: string) => {
                    // Handle events
                    console.log("Plaid Link event:", eventName);
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
            <p className="text-sm text-gray-500">
              Your bank account has been successfully connected
            </p>
          </div>

          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">
                Bank account connected successfully
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Bank Account"
      width="md"
      blurIntensity="md"
      overlayOpacity="light"
    >
      {renderContent()}
    </BaseDrawer>
  );
};
