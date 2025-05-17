"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SidebarContent } from "../../../components/sidebar-content";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Select } from "../../../components/select";
import { AddressAutocomplete } from "../../../components/address-autocomplete";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";

// Tax wizard progress steps
const steps = [
  { id: "01", name: "Personal Details", href: "/financial/tax/personal-details", status: "complete" },
  { id: "02", name: "Properties", href: "/financial/tax/properties", status: "current" },
  { id: "03", name: "Transactions", href: "/financial/tax/transactions", status: "upcoming" },
  { id: "04", name: "Adjustments", href: "/financial/tax/adjustments", status: "upcoming" },
  { id: "05", name: "Summary", href: "/financial/tax/summary", status: "upcoming" },
  { id: "06", name: "Filing", href: "/financial/tax/filing", status: "upcoming" },
];

// Property type options
const propertyTypes = [
  { value: "residential", label: "Residential" },
  { value: "furnished_holiday_let", label: "Furnished Holiday Let" },
  { value: "commercial", label: "Commercial" },
];

type PropertyMetadata = {
  ownership_percentage?: number;
  include_for_tax?: boolean;
  [key: string]: any;
};

type Property = {
  id: string;
  address: string;
  type: string;
  share_percentage: number;
  include_for_tax: boolean;
  metadata?: PropertyMetadata;
};

export default function PropertiesOverview() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Main state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Modal state for adding a new property
  const [showModal, setShowModal] = useState(false);
  const [newPropertyAddress, setNewPropertyAddress] = useState("");
  const [newPropertyType, setNewPropertyType] = useState("residential");
  const [newPropertyShare, setNewPropertyShare] = useState(100);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [townCity, setTownCity] = useState("");
  const [county, setCounty] = useState("");
  const [postcode, setPostcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch properties on component mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        // Get the authenticated user
        const user = await getAuthUser();

        if (user) {
          setUserId(user.id);

          // Fetch properties from Supabase
          const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("user_id", user.id);

          if (error) {
            throw new Error(`Error fetching properties: ${error.message}`);
          }

          if (data) {
            // Map data to Property type
            const formattedProperties: Property[] = data.map(property => {
              const metadata = property.metadata as PropertyMetadata || {};
              return {
                id: property.id,
                address: `${property.address}, ${property.city}, ${property.postcode}`,
                type: property.property_type,
                share_percentage: metadata.ownership_percentage || 100,
                include_for_tax: metadata.include_for_tax || true,
                metadata
              };
            });
            setProperties(formattedProperties);
          }
        }
      } catch (error) {
        console.error("Error loading properties:", error);
        setError(error instanceof Error ? error.message : "Failed to load properties");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  // Toggle a property's inclusion in tax calculations
  const togglePropertyInclusion = async (propertyId: string, include: boolean) => {
    try {
      const updatedProperties = properties.map(property => 
        property.id === propertyId 
          ? { ...property, include_for_tax: include } 
          : property
      );
      setProperties(updatedProperties);

      // Get existing metadata first
      const { data: propertyData } = await supabase
        .from("properties")
        .select("metadata")
        .eq("id", propertyId)
        .single();
      
      const existingMetadata = (propertyData?.metadata as PropertyMetadata) || {};
      
      // Update in database
      const { error } = await supabase
        .from("properties")
        .update({ 
          metadata: {
            ...existingMetadata,
            include_for_tax: include
          }
        })
        .eq("id", propertyId);

      if (error) {
        throw new Error(`Failed to update property: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      setError(error instanceof Error ? error.message : "Failed to update property");
    }
  };

  // Add a new property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!addressLine1 || !townCity || !postcode || !newPropertyType) {
      setError("Please fill in all required fields");
      return;
    }

    if (newPropertyShare < 1 || newPropertyShare > 100) {
      setError("Ownership share must be between 1% and 100%");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from("properties")
        .insert({
          user_id: userId,
          address: addressLine1 + (addressLine2 ? ', ' + addressLine2 : ''),
          city: townCity,
          postcode: postcode,
          property_type: newPropertyType,
          metadata: {
            ownership_percentage: newPropertyShare,
            include_for_tax: true
          },
          created_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add property: ${error.message}`);
      }

      if (data) {
        const metadata = data.metadata as PropertyMetadata || {};
        // Add to local state
        const newProperty: Property = {
          id: data.id,
          address: `${data.address}, ${data.city}, ${data.postcode}`,
          type: data.property_type,
          share_percentage: metadata.ownership_percentage || 100,
          include_for_tax: true,
          metadata
        };
        
        setProperties([...properties, newProperty]);
        
        // Reset form and close modal
        setAddressLine1("");
        setAddressLine2("");
        setTownCity("");
        setCounty("");
        setPostcode("");
        setNewPropertyType("residential");
        setNewPropertyShare(100);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error adding property:", error);
      setError(error instanceof Error ? error.message : "Failed to add property");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get property type label
  const getPropertyTypeLabel = (type: string) => {
    const propertyType = propertyTypes.find(pt => pt.value === type);
    return propertyType ? propertyType.label : type;
  };

  // Add a new function to handle saving selections and navigating
  const handleContinue = async (draft = false) => {
    if (!userId) {
      setError("User not authenticated.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Filter properties marked for inclusion
      const selectedPropertyIds = properties
        .filter(p => p.include_for_tax)
        .map(p => p.id);

      console.log('[Properties] Selected property IDs:', selectedPropertyIds);

      // Upsert the selected property IDs into tax_profiles
      const { error: taxProfileError } = await supabase
        .from("tax_profiles")
        .upsert(
          { 
            user_id: userId,
            selected_property_ids: selectedPropertyIds,
            updated_at: new Date().toISOString(), 
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          }
        );

      if (taxProfileError) {
        throw new Error(`Failed to save selected properties: ${taxProfileError.message}`);
      }

      // Navigate to the next step or dashboard
      if (draft) {
        router.push("/dashboard");
      } else {
        router.push("/financial/tax/transactions");
      }
    } catch (error) {
      console.error("Error saving property selections:", error);
      setError(error instanceof Error ? error.message : "Failed to save property selections");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout 
      sidebar={<SidebarContent currentPath={pathname} />} 
      isOnboarding={false}
      searchValue=""
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list"
              className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white"
            >
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === "complete" ? (
                    <a href={step.href}
                      className="group flex w-full items-center"
                    >
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  ) : step.status === "current" ? (
                    <a href={step.href}
                      aria-current="step"
                      className="flex items-center px-6 py-4 text-sm font-medium"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">
                        {step.name}
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">
                            {step.id}
                          </span>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">
                          {step.name}
                        </span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true"
                        className="absolute top-0 right-0 hidden h-full w-5 md:block"
                      >
                        <svg fill="none"
                          viewBox="0 0 22 80"
                          preserveAspectRatio="none"
                          className="size-full text-gray-300"
                        >
                          <path d="M0 -2L20 40L0 82"
                            stroke="currentcolor"
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
              Your Rental Properties
            </h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Review or add your rental properties. Confirm which properties you want to include for tax calculations.
            </p>
          </div>

          <div className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}

            <div className="px-4 py-4 sm:p-6">
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading your properties...</p>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-gray-900">No properties found</h3>
                    <p className="mt-2 text-gray-500">Please add your property details.</p>
                    <div className="mt-6">
                      <Button color="indigo" onClick={() => setShowModal(true)}>
                        Add Property
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 grid-cols-1">
                      {properties.map((property) => (
                        <div 
                          key={property.id} 
                          className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{property.address}</h3>
                              <div className="mt-1 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Type:</span> {getPropertyTypeLabel(property.type)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Ownership share:</span> {property.share_percentage}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                  checked={property.include_for_tax}
                                  onChange={(e) => togglePropertyInclusion(property.id, e.target.checked)}
                                />
                                <span className="ml-2 text-sm text-gray-700">Include for tax</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <Button color="indigo" onClick={() => setShowModal(true)}>
                        Add Another Property
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={() => router.push("/financial/tax/personal-details")}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button type="button"
                onClick={() => handleContinue(true)}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
              <button type="button"
                onClick={() => handleContinue(false)}
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting || loading || properties.filter(p => p.include_for_tax).length === 0}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddProperty}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add Rental Property
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="property-address" className="block text-sm font-medium text-gray-700">
                            Property Address *
                          </label>
                          <div className="mt-1">
                            <AddressAutocomplete 
                              addressLine1={addressLine1}
                              onAddressSelect={(address) => {
                                setAddressLine1(address.addressLine1);
                                setAddressLine2(address.addressLine2);
                                setTownCity(address.townCity);
                                setCounty(address.county);
                                setPostcode(address.postcode);
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="property-address-line-2" className="block text-sm font-medium text-gray-700">
                            Address Line 2
                          </label>
                          <div className="mt-1">
                            <Input
                              id="property-address-line-2"
                              value={addressLine2}
                              onChange={(e) => setAddressLine2(e.target.value)}
                              className="block w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="property-town-city" className="block text-sm font-medium text-gray-700">
                              Town/City *
                            </label>
                            <div className="mt-1">
                              <Input
                                id="property-town-city"
                                required
                                value={townCity}
                                onChange={(e) => setTownCity(e.target.value)}
                                className="block w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="property-postcode" className="block text-sm font-medium text-gray-700">
                              Postcode *
                            </label>
                            <div className="mt-1">
                              <Input
                                id="property-postcode"
                                required
                                value={postcode}
                                onChange={(e) => setPostcode(e.target.value)}
                                className="block w-full"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="property-type" className="block text-sm font-medium text-gray-700">
                            Property Type *
                          </label>
                          <div className="mt-1">
                            <Select
                              id="property-type"
                              required
                              value={newPropertyType}
                              onChange={(e) => setNewPropertyType(e.target.value)}
                              className="block w-full"
                            >
                              {propertyTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="property-share" className="block text-sm font-medium text-gray-700">
                            Ownership Share (%) *
                          </label>
                          <div className="mt-1">
                            <Input
                              id="property-share"
                              type="number"
                              min={1}
                              max={100}
                              required
                              value={newPropertyShare}
                              onChange={(e) => setNewPropertyShare(Number(e.target.value))}
                              className="block w-full"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Enter the percentage of the property that you own (1-100%).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-d9e8ff text-base font-medium text-gray-900 hover:bg-d9e8ff-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-d9e8ff-80 sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Property"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
} 