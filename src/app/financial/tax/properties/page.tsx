"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { SidebarContent } from "@/app/components/sidebar-content";
import { Navbar, NavbarSection, NavbarItem, NavbarLabel } from "../../../components/navbar";
import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Select } from "../../../components/select";
import { AddressAutocomplete } from "../../../components/address-autocomplete";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth-helpers";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";

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

// Mock data for properties
const mockProperties = [
  {
    id: "prop1",
    address: "123 Main Street, London",
    taxYear: "2023-2024",
    annualIncome: 12000,
    annualExpenses: 4500,
    taxableIncome: 7500,
    estimatedTax: 1500
  },
  {
    id: "prop2",
    address: "45 Park Avenue, Manchester",
    taxYear: "2023-2024",
    annualIncome: 9600,
    annualExpenses: 3200,
    taxableIncome: 6400,
    estimatedTax: 1280
  }
];

export default function PropertyTaxPage() {
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
  const [selectedYear, setSelectedYear] = useState("2023-2024");

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

  // Filter properties by tax year if needed
  const displayProperties = mockProperties.filter(
    prop => prop.taxYear === selectedYear
  );
  
  // Calculate summary totals
  const totalIncome = displayProperties.reduce((sum, prop) => sum + prop.annualIncome, 0);
  const totalExpenses = displayProperties.reduce((sum, prop) => sum + prop.annualExpenses, 0);
  const totalTaxable = displayProperties.reduce((sum, prop) => sum + prop.taxableIncome, 0);
  const totalTax = displayProperties.reduce((sum, prop) => sum + prop.estimatedTax, 0);

  return (
    <SidebarLayout sidebar={<SidebarContent currentPath={pathname} />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <Heading level={1} className="text-2xl font-bold">
            Property Tax Summary
          </Heading>
          <Text className="text-gray-500 mt-1">
            View and manage your property tax information for reporting purposes.
          </Text>
        </div>

        {/* Tax Year Selector */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Tax Year</h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-xs font-medium text-blue-800 uppercase">Total Income</h3>
              <p className="mt-1 text-2xl font-semibold text-blue-900">£{totalIncome.toLocaleString()}</p>
              </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-xs font-medium text-yellow-800 uppercase">Total Expenses</h3>
              <p className="mt-1 text-2xl font-semibold text-yellow-900">£{totalExpenses.toLocaleString()}</p>
                  </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-xs font-medium text-green-800 uppercase">Taxable Income</h3>
              <p className="mt-1 text-2xl font-semibold text-green-900">£{totalTaxable.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-xs font-medium text-red-800 uppercase">Estimated Tax</h3>
              <p className="mt-1 text-2xl font-semibold text-red-900">£{totalTax.toLocaleString()}</p>
          </div>
        </div>
      </div>

        {/* Properties List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4">Properties</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Income
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable Income
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Tax
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayProperties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{property.annualIncome.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{property.annualExpenses.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{property.taxableIncome.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      £{property.estimatedTax.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                          </div>
                        </div>

        {/* Tax Filing Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4">Tax Filing</h2>
          <div className="flex items-center justify-between">
                        <div>
              <p className="text-sm text-gray-600">
                Need help filing your property tax returns? ZenRent can help you prepare your tax documents.
              </p>
                </div>
                  <button
                    type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
              Prepare Tax Documents
                  </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 