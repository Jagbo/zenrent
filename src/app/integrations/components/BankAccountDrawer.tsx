"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUser } from "@/lib/hooks/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { getProperties, IProperty } from "@/lib/propertyService";
import { PlaidLink } from "@/components/plaid/PlaidLink";
import { toast } from "react-hot-toast";
import React from "react";
import { hasLinkedBankAccount } from "@/lib/plaid";
import { supabase } from "@/lib/supabase";

interface BankAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PropertyWithConnectionStatus extends IProperty {
  isConnected: boolean;
  isSyncing?: boolean;
}

export function BankAccountDrawer({ isOpen, onClose }: BankAccountDrawerProps) {
  const [properties, setProperties] = useState<PropertyWithConnectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [linkToken, setLinkToken] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlaidOpen, setIsPlaidOpen] = useState(false);
  const { user, loading: userLoading } = useUser();
  const [isExchangingToken, setIsExchangingToken] = useState(false);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setLinkToken("");
      setSelectedProperties([]);
      setIsPlaidOpen(false);
    }
  }, [isOpen]);

  // Handle drawer close attempt
  const handleCloseAttempt = () => {
    if (isPlaidOpen) {
      // Prevent closing if Plaid is open
      return;
    }
    onClose();
  };

  // Fetch properties when drawer opens and user is loaded
  useEffect(() => {
    let isMounted = true;

    async function fetchProperties() {
      if (!user) return;

      try {
        setLoading(true);
        const propertiesData = await getProperties(user.id);
        
        // Add connection status to each property
        if (isMounted && propertiesData) {
          const propertiesWithStatus: PropertyWithConnectionStatus[] = await Promise.all(
            propertiesData.map(async (prop) => {
              const isConnected = await hasLinkedBankAccount(prop.id);
              return { ...prop, isConnected, isSyncing: false };
            })
          );
          
          console.log("Fetched properties with connection status:", propertiesWithStatus);
          setProperties(propertiesWithStatus || []);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to fetch properties");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (isOpen && !userLoading) {
      fetchProperties();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, userLoading, user?.id]);

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const syncTransactions = async (propertyId: string) => {
    // Find the property to update UI
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return;

    // First check if this property has a bank connection
    const hasConnection = await refreshConnectionStatus(propertyId);
    
    if (!hasConnection) {
      // Update UI to show not connected
      setProperties(prev => 
        prev.map(p => 
          p.id === propertyId 
            ? { ...p, isConnected: false, isSyncing: false } 
            : p
        )
      );
      toast.error("No bank connection found for this property. Please connect a bank account first.");
      return;
    }

    // Mark property as syncing
    setProperties(prev => 
      prev.map(p => 
        p.id === propertyId 
          ? { ...p, isSyncing: true } 
          : p
      )
    );

    try {
      const response = await fetch("/api/plaid/sync-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: propertyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Bank connection not found for this property") {
          // Update the UI to show the property is no longer connected
          setProperties(prev => 
            prev.map(p => 
              p.id === propertyId 
                ? { ...p, isConnected: false, isSyncing: false } 
                : p
            )
          );
          throw new Error("Bank connection not found. Please reconnect your bank account.");
        }
        throw new Error(data.error || "Failed to sync transactions");
      }

      // Success case
      console.log("Transactions synced:", data);
      toast.success(`Synced ${data.added} new transactions`);
      
    } catch (error) {
      console.error("Error syncing transactions:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync transactions");
    } finally {
      // Update UI to show syncing is complete
      setProperties(prev => 
        prev.map(p => 
          p.id === propertyId 
            ? { ...p, isSyncing: false } 
            : p
        )
      );
    }
  };

  const handleConnect = async () => {
    if (!user || selectedProperties.length === 0) return;

    try {
      setIsConnecting(true);
      console.log("Requesting link token...");

      // Get a link token from our backend
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get link token:", errorData);
        throw new Error(errorData.error || "Failed to get link token");
      }

      const data = await response.json();
      console.log("Received link token response:", data);

      if (!data.link_token) {
        throw new Error("No link token received from server");
      }

      // Set the token and immediate trigger the plaid flow
      setLinkToken(data.link_token);
      console.log("Link token set successfully");
      
      // Wait a moment for the token to be set and component to update
      setTimeout(() => {
        const plaidButton = document.querySelector('button#plaid-link-button') as HTMLButtonElement;
        if (plaidButton) {
          plaidButton.click();
        } else {
          console.error("Plaid button not found");
        }
      }, 100);
      
    } catch (error: unknown) {
      console.error("Error getting link token:", error);
      // Type assertion for error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || "Failed to initialize bank connection");
      setLinkToken(""); // Reset link token on error
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePlaidSuccess = async (public_token: string, metadata: any) => {
    setIsExchangingToken(true);
    try {
      if (!selectedProperties.length) return;
      
      const response = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_token,
          metadata: {
            properties: selectedProperties,
            institution: metadata.institution,
            accounts: metadata.accounts,
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to exchange token");
      }
      
      // Wait for the response before continuing
      await response.json();
      
      toast.success("Bank account connected successfully!");
      
      // After successful token exchange, refresh the connection status
      await refreshConnectionStatus(selectedProperties[0]);
      
    } catch (error) {
      console.error("Error exchanging token:", error);
      toast.error("Failed to connect bank account. Please try again.");
    } finally {
      setIsExchangingToken(false);
      onClose();
    }
  };
  
  // Add a function to refresh the connection status for a property
  const refreshConnectionStatus = async (propertyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('property_id')
        .eq('property_id', propertyId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking bank connection:", error);
        return false;
      }
      
      // Update UI based on connection status
      if (data) {
        // Connection exists
        setProperties(prev => 
          prev.map(p => 
            p.id === propertyId 
              ? { ...p, isConnected: true } 
              : p
          )
        );
        return true;
      } else {
        // No connection exists
        setProperties(prev => 
          prev.map(p => 
            p.id === propertyId 
              ? { ...p, isConnected: false } 
              : p
          )
        );
        return false;
      }
    } catch (error) {
      console.error("Error checking bank connection:", error);
      return false;
    }
  };

  const handlePlaidExit = () => {
    console.log("Plaid Link closed");
    setIsPlaidOpen(false);
    setLinkToken("");
  };

  const handlePlaidOpen = () => {
    console.log("Plaid Link opened");
    setIsPlaidOpen(true);
  };

  // Create a reference to trigger the Plaid Link open
  const plaidLinkRef = React.useRef<{ open: () => void } | null>(null);

  if (userLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-white">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!user) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-white">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500">
              Please sign in to connect bank accounts.
            </p>
            <Button className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Count connected and unconnected properties
  const connectedCount = properties.filter(p => p.isConnected).length;
  const unconnectedCount = properties.length - connectedCount;

  return (
    <Sheet open={isOpen} onOpenChange={handleCloseAttempt} modal={false}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            Bank Account Integration
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {connectedCount > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Connected Properties ({connectedCount})
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Your bank account is connected to these properties. You can sync transactions anytime.
                </p>

                <div className="space-y-4 bg-white">
                  {properties
                    .filter(property => property.isConnected)
                    .map((property) => (
                      <div key={property.id} className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{property.name}</p>
                          <p className="text-sm text-gray-500">{property.address}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </p>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncTransactions(property.id)}
                            disabled={property.isSyncing}
                          >
                            {property.isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            {property.isSyncing ? "Syncing..." : "Sync"}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {unconnectedCount > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {connectedCount > 0 ? 'Connect More Properties' : 'Select Properties to Connect'}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select properties to connect to your bank account for automatic transaction syncing.
                </p>

                {properties.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No properties found. Please add properties to your account first.
                  </div>
                ) : (
                  <div className="space-y-4 bg-white">
                    {properties
                      .filter(property => !property.isConnected)
                      .map((property) => (
                        <div key={property.id}
                          className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 bg-white"
                        >
                          <Checkbox id={property.id}
                            checked={selectedProperties.includes(property.id)}
                            onCheckedChange={() => handlePropertySelect(property.id)}
                          />
                          <label htmlFor={property.id}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            <div className="font-medium">
                              {property.name || property.address}
                            </div>
                            <div className="text-gray-500">
                              {property.address}
                              {property.city && `, ${property.city}`}
                              {property.postcode && `, ${property.postcode}`}
                            </div>
                          </label>
                        </div>
                      ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-4 bg-white">
                  <Button variant="outline" onClick={onClose} disabled={isPlaidOpen}>
                    Cancel
                  </Button>

                  {/* Hidden PlaidLink component that will be clicked programmatically */}
                  {linkToken && (
                    <div className="absolute opacity-0 pointer-events-none">
                      <PlaidLink 
                        linkToken={linkToken}
                        onSuccess={handlePlaidSuccess}
                        onExit={handlePlaidExit}
                        onOpen={handlePlaidOpen}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleConnect}
                    disabled={
                      selectedProperties.length === 0 || isConnecting
                    }
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Selected"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {properties.length > 0 && connectedCount === properties.length && (
              <div className="text-center py-8 text-gray-500">
                All properties are connected to your bank account.
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
