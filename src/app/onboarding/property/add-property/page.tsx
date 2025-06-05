"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SidebarLayout } from "../../../components/sidebar-layout";
import { SideboardOnboardingContent } from "../../../components/sideboard-onboarding-content";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { AddressAutocomplete } from "../../../components/address-autocomplete";
import { RadioGroup, RadioField, Radio } from "../../../components/radio";
import { OnboardingProgress } from "../../../components/onboarding-progress";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define Property type if not already defined globally
interface Property {
  id: string | number;
  property_name?: string;
  address_line1?: string;
  address_line2?: string;
  town_city?: string;
  county?: string;
  postcode?: string;
  property_type?: string;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  rent_amount?: number;
  target_weekly_rent?: number;
  target_monthly_rent?: number;
}

// Interface for address fields from AddressAutocomplete
interface AddressFields {
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;
}

type Step = {
  id: string;
  name: string;
  href: string;
  status: "complete" | "current" | "upcoming";
};

const steps: Step[] = [
  {
    id: "01",
    name: "Account",
    href: "/sign-up/account-creation",
    status: "complete",
  },
  {
    id: "02",
    name: "Landlord",
    href: "/onboarding/landlord/tax-information",
    status: "complete",
  },
  {
    id: "03",
    name: "Property",
    href: "/onboarding/property/import-options",
    status: "current",
  },
  { id: "04", name: "Tenants", href: "#", status: "upcoming" },
  { id: "05", name: "Setup", href: "#", status: "upcoming" },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [propertyCount, setPropertyCount] = useState(1);
  const [savedProperties, setSavedProperties] = useState<Partial<Property & {addressFull?: string}>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingProperties, setHasExistingProperties] = useState(false);

  // Basic property state
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState<AddressFields | null>(null);
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState<number | string>("");
  const [bathrooms, setBathrooms] = useState<number | string>("");
  const [parking, setParking] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [squareFootage, setSquareFootage] = useState<number | string>("");
  const [constructionDate, setConstructionDate] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number | string>("");
  const [mortgageInterest, setMortgageInterest] = useState<number | string>("");
  const [propertyTax, setPropertyTax] = useState<number | string>("");
  const [insuranceCost, setInsuranceCost] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  // Fetch current user on component mount
  useEffect(() => {
    async function getUser() {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error("Error fetching user:", userError);
          router.push("/sign-up");
          return;
        }

        if (userData && userData.user) {
          setUserId(userData.user.id);
        } else {
          router.push("/sign-up");
        }
      } catch (error: any) {
        console.error("Error in getUser:", error);
        router.push("/sign-up");
      }
    }
    getUser();
  }, [router, supabase.auth]);

  useEffect(() => {
    try {
      const existingPropertiesItem = localStorage.getItem("onboardingProperties");
      if (existingPropertiesItem) {
        const parsedProperties = JSON.parse(existingPropertiesItem) as Partial<Property & {addressFull?: string}>[]; 
        if (Array.isArray(parsedProperties)) {
            setSavedProperties(parsedProperties);
            setPropertyCount(parsedProperties.length + 1);
        } else {
            setSavedProperties([]);
            setPropertyCount(1);
        }
      } else {
        setSavedProperties([]);
        setPropertyCount(1);
      }
    } catch (error: any) { 
      console.error("Error loading saved properties:", error);
      setSavedProperties([]);
      setPropertyCount(1);
    }
  }, []);

  // Load existing properties from DB to check if any exist
  useEffect(() => {
    async function loadExistingProperties() {
      if (!userId) return;
      setLoading(true);
      try {
        const { data, error: dbError } = await supabase
          .from("properties")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (dbError) throw dbError;
        setHasExistingProperties(data && data.length > 0);
      } catch (dbError: any) {
        console.error("Error loading existing properties:", dbError);
        setError("Failed to check for existing properties.");
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      loadExistingProperties();
    }
  }, [userId, supabase]);

  const resetFormFields = () => {
    setPropertyName("");
    setAddress(null);
    setPropertyType("");
    setBedrooms("");
    setBathrooms("");
    setParking("");
    setFurnishing("");
    setSquareFootage("");
    setConstructionDate("");
    setPurchaseDate("");
    setPurchasePrice("");
    setMortgageInterest("");
    setPropertyTax("");
    setInsuranceCost("");
    setNotes("");
  };

  const preparePropertyData = () => {
    if (!userId || !address) {
      setError("User or address information is missing.");
      return null;
    }
    const postcodePart = address.postcode?.replace(/\s+/g, "").substring(0, 4) || "PROP";
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const propertyCode = `${postcodePart}-${randomPart}`;

    return {
      user_id: userId,
      property_code: propertyCode,
      property_name: propertyName || `${address.addressLine1}, ${address.postcode}`,
      address_line1: address.addressLine1,
      address_line2: address.addressLine2,
      town_city: address.townCity,
      county: address.county,
      postcode: address.postcode,
      property_type: propertyType,
      number_of_bedrooms: bedrooms ? parseInt(String(bedrooms)) : undefined,
      number_of_bathrooms: bathrooms ? parseFloat(String(bathrooms)) : undefined,
      parking_availability: parking,
      furnishing_status: furnishing,
      square_footage: squareFootage ? parseFloat(String(squareFootage)) : undefined,
      construction_date: constructionDate || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(String(purchasePrice)) : undefined,
      mortgage_interest_rate: mortgageInterest ? parseFloat(String(mortgageInterest)) : undefined, // Assuming this is rate
      council_tax_band: propertyTax, // Assuming propertyTax state is for council tax band
      insurance_cost: insuranceCost ? parseFloat(String(insuranceCost)) : undefined,
      notes: notes,
      status: "active", // Default status
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !address || !propertyType || !bedrooms || !bathrooms) {
      setError("Please fill in all required fields: Address, Property Type, Bedrooms, Bathrooms.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const propertyData = preparePropertyData();
    if (!propertyData) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select();

      if (insertError) throw insertError;
      console.log("Property saved to Supabase:", data);
      // Navigate to the next step or show success
      router.push("/onboarding/tenant/import-options"); 
    } catch (err: any) {
      console.error("Error saving property:", err);
      setError(err.message || "Failed to save property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!userId || !address) {
      setError("User or address information is missing to save a draft.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    let propertyData = preparePropertyData();
    if (!propertyData) {
       setIsSubmitting(false);
       return;
    }
    propertyData = { ...propertyData, status: "draft" };

    try {
      const { data, error: insertError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select();

      if (insertError) throw insertError;
      console.log("Property draft saved to Supabase:", data);
      alert("Property saved as draft.");
      // Optionally reset form or navigate
    } catch (err: any) {
      console.error("Error saving property draft:", err);
      setError(err.message || "Failed to save property draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = async () => {
    if (!userId || !address || !propertyType || !bedrooms || !bathrooms) {
      setError("Please fill in current property's required fields before adding another.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const propertyData = preparePropertyData();
     if (!propertyData) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select();

      if (insertError) throw insertError;
      console.log("Property saved to Supabase:", data);
      
      const newSavedProperty: Partial<Property & {addressFull?: string}> = {
        id: data && data[0] ? data[0].id : Date.now(),
        property_name: propertyData.property_name,
        addressFull: address ? `${address.addressLine1}, ${address.postcode}` : undefined,
        property_type: propertyType,
        number_of_bedrooms: Number(bedrooms),
      };
      const updatedSavedProperties = [...savedProperties, newSavedProperty];
      setSavedProperties(updatedSavedProperties);
      localStorage.setItem("onboardingProperties", JSON.stringify(updatedSavedProperties));
      
      setPropertyCount(propertyCount + 1);
      resetFormFields();
      alert("Property saved. You can now add another property.");

    } catch (err: any) {
      console.error("Error saving property before adding another:", err);
      setError(err.message || "Failed to save property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading indicator while fetching user data or existing properties
  if (loading) {
    return (
      <SidebarLayout isOnboarding={true}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner label="Loading..." />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout isOnboarding={true}>
      <div className="space-y-8">
        {/* Page Header */}
        <OnboardingProgress steps={steps} />

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base/7 font-semibold text-gray-900">
                Add Property
              </h2>
            </div>
            <p className="mt-1 text-sm/6 text-gray-600">
              Enter the details of your property to add it to your portfolio.
            </p>

            {/* Display error if any */}
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Display saved properties below the description */}
            {Array.isArray(savedProperties) && savedProperties.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">
                  Previously Added Properties ({savedProperties.length})
                </h3>
                <ul className="mt-2 space-y-3">
                  {savedProperties.map((property, index) => (
                    <li key={property.id || index}>
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {property.property_name || property.addressFull || `Property ${index + 1}`}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {property.property_type} • {property.number_of_bedrooms}{" "}
                              {Number(property.number_of_bedrooms) > 1
                                ? "Bedrooms"
                                : "Bedroom"}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-[#D9E8FF] px-2.5 py-0.5 text-xs font-medium text-gray-900">
                            Property {index + 1}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}
            className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2"
          >
            {/* Property Form Header - Show which property is being added */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:rounded-t-xl sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold leading-7 text-gray-900">
                  Property Details
                </h3>
                {propertyCount > 1 && (
                  <span className="inline-flex items-center rounded-full bg-[#D9E8FF] px-2.5 py-0.5 text-xs font-medium text-gray-900">
                    Property {propertyCount}
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Property Basics */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Property Basics
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Enter the basic information about your property.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="propertyName"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Property Name (Optional)
                      </label>
                      <div className="mt-2">
                        <input type="text"
                          name="propertyName"
                          id="propertyName"
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="e.g., 123 Main St Apartment"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="address"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Property address <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <AddressAutocomplete 
                          addressLine1={address?.addressLine1 || ""}
                          onAddressSelect={(selectedAddress) => {
                            setAddress(selectedAddress);
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        UK address with postcode
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="propertyType"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Property type <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <select id="propertyType"
                          name="propertyType"
                          required
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select property type</option>
                          <option value="flat">Flat</option>
                          <option value="house">House</option>
                          <option value="hmo">HMO</option>
                          <option value="studio">Studio</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="bedrooms"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Bedrooms <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <input type="number"
                          name="bedrooms"
                          id="bedrooms"
                          required
                          min="0"
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="bathrooms"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Bathrooms <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <input type="number"
                          name="bathrooms"
                          id="bathrooms"
                          required
                          min="0"
                          step="0.5"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="furnishing"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Furnishing status
                      </label>
                      <div className="mt-2">
                        <select id="furnishing"
                          name="furnishing"
                          value={furnishing}
                          onChange={(e) => setFurnishing(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select status</option>
                          <option value="furnished">Furnished</option>
                          <option value="unfurnished">Unfurnished</option>
                          <option value="partFurnished">Part Furnished</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Property Details
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Additional information about your property.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="squareFootage"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Square footage/meters
                      </label>
                      <div className="mt-2">
                        <input type="number"
                          name="squareFootage"
                          id="squareFootage"
                          min="0"
                          value={squareFootage}
                          onChange={(e) => setSquareFootage(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="constructionDate"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Construction date
                      </label>
                      <div className="mt-2">
                        <input type="date"
                          name="constructionDate"
                          id="constructionDate"
                          value={constructionDate}
                          onChange={(e) => setConstructionDate(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="purchaseDate"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Purchase date
                      </label>
                      <div className="mt-2">
                        <input type="date"
                          name="purchaseDate"
                          id="purchaseDate"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="purchasePrice"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Purchase price (£)
                      </label>
                      <div className="mt-2">
                        <input type="text"
                          name="purchasePrice"
                          id="purchasePrice"
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="mortgageInterest"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Mortgage interest (£/year)
                      </label>
                      <div className="mt-2">
                        <input type="text"
                          name="mortgageInterest"
                          id="mortgageInterest"
                          value={mortgageInterest}
                          onChange={(e) => setMortgageInterest(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="propertyTax"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Property tax (£/year)
                      </label>
                      <div className="mt-2">
                        <input type="text"
                          name="propertyTax"
                          id="propertyTax"
                          value={propertyTax}
                          onChange={(e) => setPropertyTax(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="insuranceCost"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Insurance cost (£/year)
                      </label>
                      <div className="mt-2">
                        <input type="text"
                          name="insuranceCost"
                          id="insuranceCost"
                          value={insuranceCost}
                          onChange={(e) => setInsuranceCost(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Notes
                      </label>
                      <div className="mt-2">
                        <textarea
                          name="notes"
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          placeholder="Enter any additional notes about the property"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </button>
              <button type="button"
                onClick={handleAddAnother}
                disabled={isSubmitting}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Add Another Property"}
              </button>
              <button type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#C9DFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9D7FF] disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Property & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
