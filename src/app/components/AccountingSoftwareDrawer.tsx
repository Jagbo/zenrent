"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BaseDrawer } from "./BaseDrawer";

// Define the AccountingSoftwareDrawer props interface
export interface AccountingSoftwareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// IntegrationOption component for accounting software selection
interface IntegrationOptionProps {
  logo: string;
  name: string;
  onClick: () => void;
  selected: boolean;
}

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
      {selected && (
        <svg className="w-5 h-5 ml-auto text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path fillRule="evenodd"
            d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

export const AccountingSoftwareDrawer: React.FC<
  AccountingSoftwareDrawerProps
> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const providers = [
    { name: "QuickBooks", logo: "/images/integrations/quickbooks.png" },
    { name: "Xero", logo: "/images/integrations/Xero.png" },
    { name: "Sage", logo: "/images/integrations/sage.png" },
  ];

  // Handle connection to the selected provider
  const handleConnect = async () => {
    // Here you would implement the connection logic for the selected provider
    console.log(`Connecting to ${selectedProvider}...`);

    // Simulate a successful connection
    setTimeout(() => {
      onClose();
      // Reset state after drawer closes
      setTimeout(() => {
        setStep(1);
        setSelectedProvider(null);
      }, 300);
    }, 1000);
  };

  // Reset drawer state when closed
  const handleClose = () => {
    onClose();
    // Reset state after drawer closes
    setTimeout(() => {
      setStep(1);
      setSelectedProvider(null);
    }, 300);
  };

  // Content to display inside the drawer
  const renderContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              Choose your accounting software
            </h3>
            <p className="text-sm text-gray-500">
              Select the accounting software you use to manage your business
            </p>
          </div>

          <div className="space-y-4">
            {providers.map((provider) => (
              <IntegrationOption key={provider.name}
                logo={provider.logo}
                name={provider.name}
                selected={selectedProvider === provider.name}
                onClick={() => {
                  setSelectedProvider(provider.name);
                  setStep(2);
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (step === 2 && selectedProvider) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              Connect to {selectedProvider}
            </h3>
            <p className="text-sm text-gray-500">
              Follow these steps to connect your {selectedProvider} account
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-200">
              <p className="text-sm">
                You'll be redirected to {selectedProvider} to authorize access
                to your account
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sign in to your {selectedProvider} account
                  </p>
                  <p className="text-sm text-gray-500">
                    Use your existing credentials to sign in
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Authorize ZenRent
                  </p>
                  <p className="text-sm text-gray-500">
                    Grant permission to access your financial data
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Complete setup
                  </p>
                  <p className="text-sm text-gray-500">
                    Configure how data is synced between systems
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleConnect}>
            Connect to {selectedProvider}
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <BaseDrawer isOpen={isOpen}
      onClose={handleClose}
      title="Connect Accounting Software"
      width="md"
      blurIntensity="md"
      overlayOpacity="light"
    >
      {renderContent()}
    </BaseDrawer>
  );
};
