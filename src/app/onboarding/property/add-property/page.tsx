"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AddressAutocomplete } from '../../../components/address-autocomplete';
import { RadioGroup, RadioField, Radio } from '../../../components/radio';
import { OnboardingProgress } from '../../../components/onboarding-progress';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Step = {
  id: string;
  name: string;
  href: string;
  status: 'complete' | 'current' | 'upcoming';
};

const steps: Step[] = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'current' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

export default function AddProperty() {
  const router = useRouter();
  
  // Track property number and list of saved properties
  const [propertyCount, setPropertyCount] = useState(1);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  
  // Add Supabase related state
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic property state
  const [formData, setFormData] = useState({
    // Property Basics
    address: '',
    propertyType: '',
    propertySubtype: '',
    bedrooms: '',
    bathrooms: '',
    furnishingStatus: '',
    
    // Property Details
    squareFootage: '',
    councilTaxBand: '',
    epcRating: '',
    heatingType: '',
    parking: '',
    outdoorSpace: '',
    features: [] as string[],
    
    // HMO Information
    isHmo: false,
    hmoLicenseNumber: '',
    hmoLicenseExpiry: '',
    hmoMaxOccupancy: '',
    hmoSharedFacilities: [] as string[],
    
    // Leasehold Information
    propertyOwnership: 'freehold',
    leaseLengthRemaining: '',
    groundRent: '',
    serviceCharge: '',
    managementCompany: ''
  });
  
  // Fetch current user on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        // In development, use a fixed user ID for testing
        if (process.env.NODE_ENV === 'development') {
          setUserId('00000000-0000-0000-0000-000000000001');
          return;
        }
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setError('Authentication error. Please sign in again.');
          router.push('/sign-in');
          return;
        }
        
        if (data && data.user) {
          setUserId(data.user.id);
        } else {
          // Redirect to sign in if no user is found
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setError('Authentication error. Please sign in again.');
      }
    };
    
    getUser();
    
    // Load saved properties from localStorage
    try {
      const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      if (existingProperties.length > 0) {
        setSavedProperties(existingProperties);
        setPropertyCount(existingProperties.length + 1);
      }
    } catch (error) {
      console.error("Error loading saved properties:", error);
    }
  }, [router]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      if (name === 'isHmo') {
        setFormData({
          ...formData,
          [name]: checked
        });
      } else if (name.startsWith('features-') || name.startsWith('hmoSharedFacilities-')) {
        const field = name.startsWith('features-') ? 'features' : 'hmoSharedFacilities';
        const feature = name.split('-').slice(1).join('-'); // Handle feature IDs that might contain hyphens
        
        if (checked) {
          // Add the feature to the array if it's not already there
          const currentFeatures = formData[field as keyof typeof formData] as string[];
          if (!currentFeatures.includes(feature)) {
            setFormData({
              ...formData,
              [field]: [...currentFeatures, feature]
            });
          }
        } else {
          // Remove the feature from the array
          const currentFeatures = formData[field as keyof typeof formData] as string[];
          setFormData({
            ...formData,
            [field]: currentFeatures.filter(item => item !== feature)
          });
        }
      }
    } else {
      // For property type changes, update isHmo field automatically
      if (name === 'propertyType') {
        setFormData({
          ...formData,
          [name]: value,
          isHmo: value === 'hmo' // Set isHmo field to true if property type is 'hmo'
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation to ensure required fields are filled
    if (!formData.address || !formData.propertyType || !formData.bedrooms || !formData.bathrooms) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!userId) {
      setError('User not authenticated. Please sign in again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting property data to Supabase:', formData);
      
      // Generate a property code based on postcode and random string
      const postcodePart = formData.address.split(',').pop()?.trim().replace(/\s+/g, '').substring(0, 4) || 'PROP';
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const propertyCode = `${postcodePart}-${randomPart}`;
      
      // Extract city and postcode from address
      const addressParts = formData.address.split(',');
      const postcode = addressParts.pop()?.trim() || '';
      const city = addressParts.pop()?.trim() || '';
      
      // Prepare property data for Supabase
      const propertyData = {
        user_id: userId,
        property_code: propertyCode,
        address: formData.address,
        city: city,
        postcode: postcode,
        property_type: formData.propertyType,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        is_furnished: formData.furnishingStatus === 'furnished' ? true : 
                      formData.furnishingStatus === 'partFurnished' ? true : false,
        description: '',
        status: 'active',
        has_garden: formData.features.includes('garden'),
        has_parking: formData.parking !== 'none' && formData.parking !== '',
        notes: '',
        metadata: {
          propertySubtype: formData.propertySubtype,
          furnishingStatus: formData.furnishingStatus,
          squareFootage: formData.squareFootage,
          councilTaxBand: formData.councilTaxBand,
          epcRating: formData.epcRating,
          heatingType: formData.heatingType,
          parking: formData.parking,
          outdoorSpace: formData.outdoorSpace,
          features: formData.features,
          isHmo: formData.isHmo,
          hmoDetails: formData.isHmo ? {
            licenseNumber: formData.hmoLicenseNumber,
            licenseExpiry: formData.hmoLicenseExpiry,
            maxOccupancy: formData.hmoMaxOccupancy,
            sharedFacilities: formData.hmoSharedFacilities
          } : null,
          propertyOwnership: formData.propertyOwnership,
          leaseholdDetails: formData.propertyOwnership === 'leasehold' ? {
            leaseLengthRemaining: formData.leaseLengthRemaining,
            groundRent: formData.groundRent,
            serviceCharge: formData.serviceCharge,
            managementCompany: formData.managementCompany
          } : null
        }
      };
      
      // Insert property into Supabase
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Property saved to Supabase:', data);
      
      // Also save to localStorage for backup and to show in the UI
      try {
        const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
        existingProperties.push({
          ...formData,
          supabaseId: data[0]?.id,
          propertyCode: propertyCode
        });
        localStorage.setItem('savedProperties', JSON.stringify(existingProperties));
        setSavedProperties(existingProperties);
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
      }
      
      // Navigate to the next step
      router.push('/onboarding/tenant/import-options');
    } catch (error: any) {
      console.error("Error saving property to Supabase:", error);
      setError(error.message || 'Failed to save property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) {
      setError('User not authenticated. Please sign in again.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Saving property data as draft to Supabase:', formData);
      
      // Generate a property code
      const postcodePart = formData.address.split(',').pop()?.trim().replace(/\s+/g, '').substring(0, 4) || 'DRAFT';
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const propertyCode = `${postcodePart}-${randomPart}`;
      
      // Extract city and postcode from address (if available)
      const addressParts = formData.address.split(',');
      const postcode = addressParts.length > 1 ? addressParts.pop()?.trim() || '' : '';
      const city = addressParts.length > 1 ? addressParts.pop()?.trim() || '' : '';
      
      // Prepare property data for Supabase with draft status
      const propertyData = {
        user_id: userId,
        property_code: propertyCode,
        address: formData.address || 'Draft Property',
        city: city || '',
        postcode: postcode || '',
        property_type: formData.propertyType || '',
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : 0,
        status: 'draft', // Mark as draft
        metadata: {
          isDraft: true,
          draftData: formData
        }
      };
      
      // Insert draft property into Supabase
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Property draft saved to Supabase:', data);
      
      // Also save to localStorage
      try {
        localStorage.setItem('propertyDataDraft', JSON.stringify({
          ...formData,
          supabaseId: data[0]?.id,
          propertyCode: propertyCode,
          status: 'draft'
        }));
      } catch (storageError) {
        console.error("Error saving draft to localStorage:", storageError);
      }
      
      alert('Your property details have been saved as draft');
    } catch (error: any) {
      console.error("Error saving property draft to Supabase:", error);
      setError(error.message || 'Failed to save draft. Please try again.');
      
      // Fall back to localStorage if Supabase fails
      try {
        localStorage.setItem('propertyDataDraft', JSON.stringify(formData));
        alert('Your property details have been saved locally (failed to save to database)');
      } catch (storageError) {
        console.error("Error saving property draft data:", storageError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle add another property
  const handleAddAnother = async () => {
    if (!userId) {
      setError('User not authenticated. Please sign in again.');
      return;
    }
    
    // First save the current property
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Adding another property after saving current one to Supabase:', formData);
      
      // Only proceed if we have the minimum required data
      if (!formData.address || !formData.propertyType) {
        alert('Please fill in at least the address and property type before adding another property');
        setIsSubmitting(false);
        return;
      }
      
      // Generate a property code
      const postcodePart = formData.address.split(',').pop()?.trim().replace(/\s+/g, '').substring(0, 4) || 'PROP';
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const propertyCode = `${postcodePart}-${randomPart}`;
      
      // Extract city and postcode from address
      const addressParts = formData.address.split(',');
      const postcode = addressParts.pop()?.trim() || '';
      const city = addressParts.length > 0 ? addressParts.pop()?.trim() || '' : '';
      
      // Prepare property data for Supabase
      const propertyData = {
        user_id: userId,
        property_code: propertyCode,
        address: formData.address,
        city: city,
        postcode: postcode,
        property_type: formData.propertyType,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : 0,
        is_furnished: formData.furnishingStatus === 'furnished' ? true : 
                      formData.furnishingStatus === 'partFurnished' ? true : false,
        description: '',
        status: 'active',
        has_garden: formData.features.includes('garden'),
        has_parking: formData.parking !== 'none' && formData.parking !== '',
        metadata: {
          propertySubtype: formData.propertySubtype,
          furnishingStatus: formData.furnishingStatus,
          squareFootage: formData.squareFootage,
          councilTaxBand: formData.councilTaxBand,
          epcRating: formData.epcRating,
          heatingType: formData.heatingType,
          parking: formData.parking,
          outdoorSpace: formData.outdoorSpace,
          features: formData.features,
          isHmo: formData.isHmo,
          hmoDetails: formData.isHmo ? {
            licenseNumber: formData.hmoLicenseNumber,
            licenseExpiry: formData.hmoLicenseExpiry,
            maxOccupancy: formData.hmoMaxOccupancy,
            sharedFacilities: formData.hmoSharedFacilities
          } : null,
          propertyOwnership: formData.propertyOwnership,
          leaseholdDetails: formData.propertyOwnership === 'leasehold' ? {
            leaseLengthRemaining: formData.leaseLengthRemaining,
            groundRent: formData.groundRent,
            serviceCharge: formData.serviceCharge,
            managementCompany: formData.managementCompany
          } : null
        }
      };
      
      // Insert property into Supabase
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Property saved to Supabase:', data);
      
      // Also save to localStorage and update state
      try {
        const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
        const newProperty = {
          ...formData,
          supabaseId: data[0]?.id,
          propertyCode: propertyCode
        };
        existingProperties.push(newProperty);
        localStorage.setItem('savedProperties', JSON.stringify(existingProperties));
        
        // Update state with new property
        setSavedProperties(existingProperties);
        setPropertyCount(existingProperties.length + 1);
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
      }
      
      // Reset form for new property
      setFormData({
        // Property Basics
        address: '',
        propertyType: '',
        propertySubtype: '',
        bedrooms: '',
        bathrooms: '',
        furnishingStatus: '',
        
        // Property Details
        squareFootage: '',
        councilTaxBand: '',
        epcRating: '',
        heatingType: '',
        parking: '',
        outdoorSpace: '',
        features: [],
        
        // HMO Information
        isHmo: false,
        hmoLicenseNumber: '',
        hmoLicenseExpiry: '',
        hmoMaxOccupancy: '',
        hmoSharedFacilities: [],
        
        // Leasehold Information
        propertyOwnership: 'freehold',
        leaseLengthRemaining: '',
        groundRent: '',
        serviceCharge: '',
        managementCompany: ''
      });
      
      // Show confirmation
      alert('Property saved. You can now add another property.');
    } catch (error: any) {
      console.error("Error saving property to Supabase:", error);
      setError(error.message || 'Failed to save property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom sidebar content without saved properties
  const CustomSidebar = () => (
    <div className="h-full flex flex-col">
      <SideboardOnboardingContent />
    </div>
  );

  return (
    <SidebarLayout 
      sidebar={<CustomSidebar />}
      isOnboarding={true}
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <OnboardingProgress steps={steps} />

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base/7 font-semibold text-gray-900">Add Property</h2>
            </div>
            <p className="mt-1 text-sm/6 text-gray-600">
              Enter the details of your property to add it to your portfolio.
            </p>
            
            {/* Display error if any */}
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display saved properties below the description */}
            {savedProperties.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Previously Added Properties</h3>
                <ul className="mt-2 space-y-3">
                  {savedProperties.map((property, index) => (
                    <li key={index}>
                      <div className="bg-white shadow overflow-hidden sm:rounded-md p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {property.address}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {property.propertyType} • {property.bedrooms} {parseInt(property.bedrooms) > 1 ? 'Bedrooms' : 'Bedroom'}
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

          <form onSubmit={handleSubmit} className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
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
                  <h2 className="text-base/7 font-semibold text-gray-900">Property Basics</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Enter the basic information about your property.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                        Property address <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <AddressAutocomplete
                          addressLine1={formData.address}
                          onAddressSelect={(address) => {
                            setFormData({
                              ...formData,
                              address: address.addressLine1 + (address.addressLine2 ? ', ' + address.addressLine2 : '') + ', ' + address.townCity + ', ' + address.county + ', ' + address.postcode
                            });
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        UK address with postcode
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="propertyType" className="block text-sm font-medium leading-6 text-gray-900">
                        Property type <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <select
                          id="propertyType"
                          name="propertyType"
                          required
                          value={formData.propertyType}
                          onChange={handleInputChange}
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
                      <label htmlFor="propertySubtype" className="block text-sm font-medium leading-6 text-gray-900">
                        Property subtype
                      </label>
                      <div className="mt-2">
                        <select
                          id="propertySubtype"
                          name="propertySubtype"
                          value={formData.propertySubtype}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select subtype</option>
                          {formData.propertyType === 'flat' && (
                            <>
                              <option value="purpose-built">Purpose Built</option>
                              <option value="converted">Converted</option>
                              <option value="maisonette">Maisonette</option>
                            </>
                          )}
                          {formData.propertyType === 'house' && (
                            <>
                              <option value="detached">Detached</option>
                              <option value="semi-detached">Semi-Detached</option>
                              <option value="terraced">Terraced</option>
                              <option value="end-of-terrace">End of Terrace</option>
                              <option value="cottage">Cottage</option>
                              <option value="bungalow">Bungalow</option>
                            </>
                          )}
                          {formData.propertyType === 'hmo' && (
                            <>
                              <option value="shared-house">Shared House</option>
                              <option value="bedsits">Bedsits</option>
                              <option value="student-accommodation">Student Accommodation</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="bedrooms" className="block text-sm font-medium leading-6 text-gray-900">
                        Bedrooms <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="bedrooms"
                          id="bedrooms"
                          required
                          min="0"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="bathrooms" className="block text-sm font-medium leading-6 text-gray-900">
                        Bathrooms <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="bathrooms"
                          id="bathrooms"
                          required
                          min="0"
                          step="0.5"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="furnishingStatus" className="block text-sm font-medium leading-6 text-gray-900">
                        Furnishing status
                      </label>
                      <div className="mt-2">
                        <select
                          id="furnishingStatus"
                          name="furnishingStatus"
                          value={formData.furnishingStatus}
                          onChange={handleInputChange}
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
                  <h2 className="text-base/7 font-semibold text-gray-900">Property Details</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Additional information about your property.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="squareFootage" className="block text-sm font-medium leading-6 text-gray-900">
                        Square footage/meters
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="squareFootage"
                          id="squareFootage"
                          min="0"
                          value={formData.squareFootage}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="councilTaxBand" className="block text-sm font-medium leading-6 text-gray-900">
                        Council tax band
                      </label>
                      <div className="mt-2">
                        <select
                          id="councilTaxBand"
                          name="councilTaxBand"
                          value={formData.councilTaxBand}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select band</option>
                          <option value="A">Band A</option>
                          <option value="B">Band B</option>
                          <option value="C">Band C</option>
                          <option value="D">Band D</option>
                          <option value="E">Band E</option>
                          <option value="F">Band F</option>
                          <option value="G">Band G</option>
                          <option value="H">Band H</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="epcRating" className="block text-sm font-medium leading-6 text-gray-900">
                        EPC rating
                      </label>
                      <div className="mt-2">
                        <select
                          id="epcRating"
                          name="epcRating"
                          value={formData.epcRating}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select rating</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="F">F</option>
                          <option value="G">G</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="heatingType" className="block text-sm font-medium leading-6 text-gray-900">
                        Heating type
                      </label>
                      <div className="mt-2">
                        <select
                          id="heatingType"
                          name="heatingType"
                          value={formData.heatingType}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select heating type</option>
                          <option value="gas-central">Gas Central Heating</option>
                          <option value="electric">Electric Heating</option>
                          <option value="oil">Oil Heating</option>
                          <option value="solid-fuel">Solid Fuel</option>
                          <option value="air-source">Air Source Heat Pump</option>
                          <option value="ground-source">Ground Source Heat Pump</option>
                          <option value="district">District Heating</option>
                          <option value="none">No Heating</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="parking" className="block text-sm font-medium leading-6 text-gray-900">
                        Parking availability
                      </label>
                      <div className="mt-2">
                        <select
                          id="parking"
                          name="parking"
                          value={formData.parking}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select parking</option>
                          <option value="on-street">On-street Parking</option>
                          <option value="off-street">Off-street Parking</option>
                          <option value="garage">Garage</option>
                          <option value="allocated">Allocated Space</option>
                          <option value="none">No Parking</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="outdoorSpace" className="block text-sm font-medium leading-6 text-gray-900">
                        Garden/outdoor space
                      </label>
                      <div className="mt-2">
                        <select
                          id="outdoorSpace"
                          name="outdoorSpace"
                          value={formData.outdoorSpace}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                        >
                          <option value="">Select outdoor space</option>
                          <option value="private-garden">Private Garden</option>
                          <option value="shared-garden">Shared Garden</option>
                          <option value="patio">Patio/Terrace</option>
                          <option value="balcony">Balcony</option>
                          <option value="none">No Outdoor Space</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Property features
                      </label>
                      <div className="mt-2 grid grid-cols-1 gap-y-2 sm:grid-cols-2 md:grid-cols-3">
                        {[
                          { id: 'double-glazing', label: 'Double Glazing' },
                          { id: 'garden', label: 'Garden' },
                          { id: 'garage', label: 'Garage' },
                          { id: 'driveway', label: 'Driveway' },
                          { id: 'balcony', label: 'Balcony' },
                          { id: 'fireplace', label: 'Fireplace' },
                          { id: 'washing-machine', label: 'Washing Machine' },
                          { id: 'dishwasher', label: 'Dishwasher' },
                          { id: 'burglar-alarm', label: 'Burglar Alarm' },
                          { id: 'pets-allowed', label: 'Pets Allowed' },
                          { id: 'wheelchair-access', label: 'Wheelchair Access' },
                          { id: 'satellite-tv', label: 'Satellite/Cable TV' }
                        ].map((feature) => (
                          <div key={feature.id} className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id={`features-${feature.id}`}
                                name={`features-${feature.id}`}
                                type="checkbox"
                                checked={formData.features.includes(feature.id)}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-[#D9E8FF]"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor={`features-${feature.id}`} className="font-medium text-gray-900 cursor-pointer">
                                {feature.label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* HMO Information - Only show if property type is HMO */}
                {formData.propertyType === 'hmo' && (
                  <div className="border-b border-gray-900/10 pb-6">
                    <h2 className="text-base/7 font-semibold text-gray-900">HMO Information</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                      Details about your House in Multiple Occupation.
                    </p>
                    
                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="hmoLicenseNumber" className="block text-sm font-medium leading-6 text-gray-900">
                          HMO license number
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            name="hmoLicenseNumber"
                            id="hmoLicenseNumber"
                            value={formData.hmoLicenseNumber}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="hmoLicenseExpiry" className="block text-sm font-medium leading-6 text-gray-900">
                          License expiry date
                        </label>
                        <div className="mt-2">
                          <input
                            type="date"
                            name="hmoLicenseExpiry"
                            id="hmoLicenseExpiry"
                            value={formData.hmoLicenseExpiry}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="hmoMaxOccupancy" className="block text-sm font-medium leading-6 text-gray-900">
                          Maximum occupancy
                        </label>
                        <div className="mt-2">
                          <input
                            type="number"
                            name="hmoMaxOccupancy"
                            id="hmoMaxOccupancy"
                            min="1"
                            value={formData.hmoMaxOccupancy}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Shared facilities
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-y-2 sm:grid-cols-2 md:grid-cols-3">
                          {[
                            { id: 'kitchen', label: 'Kitchen' },
                            { id: 'bathroom', label: 'Bathroom' },
                            { id: 'toilet', label: 'Toilet' },
                            { id: 'living-room', label: 'Living Room' },
                            { id: 'dining-room', label: 'Dining Room' },
                            { id: 'garden', label: 'Garden' },
                            { id: 'laundry', label: 'Laundry Facilities' }
                          ].map((facility) => (
                            <div key={facility.id} className="relative flex items-start">
                              <div className="flex h-6 items-center">
                                <input
                                  id={`hmoSharedFacilities-${facility.id}`}
                                  name={`hmoSharedFacilities-${facility.id}`}
                                  type="checkbox"
                                  checked={formData.hmoSharedFacilities.includes(facility.id)}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-[#D9E8FF]"
                                />
                              </div>
                              <div className="ml-3 text-sm leading-6">
                                <label htmlFor={`hmoSharedFacilities-${facility.id}`} className="font-medium text-gray-900">
                                  {facility.label}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Leasehold Information */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Leasehold Information</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Details about the property ownership.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label className="text-sm font-medium leading-6 text-gray-900">
                        Property ownership
                      </label>
                      <div className="mt-2 space-y-4">
                        <RadioGroup
                          value={formData.propertyOwnership}
                          onChange={(value: string) => setFormData({ ...formData, propertyOwnership: value })}
                        >
                          <RadioField className="w-full">
                            <div className="flex w-full">
                              <div className="flex items-start">
                                <Radio color="custom" value="freehold" />
                                <div className="ml-2 flex flex-col" style={{width: "450px"}}>
                                  <span className="text-sm font-medium text-gray-900 block">Freehold</span>
                                  <span className="text-sm text-gray-500 block">You own the property and land outright</span>
                                </div>
                              </div>
                            </div>
                          </RadioField>
                          <RadioField className="w-full">
                            <div className="flex w-full">
                              <div className="flex items-start">
                                <Radio color="custom" value="leasehold" />
                                <div className="ml-2 flex flex-col" style={{width: "450px"}}>
                                  <span className="text-sm font-medium text-gray-900 block">Leasehold</span>
                                  <span className="text-sm text-gray-500 block">You own the property for a fixed period but not the land</span>
                                </div>
                              </div>
                            </div>
                          </RadioField>
                        </RadioGroup>
                      </div>
                    </div>

                    {(formData.propertyOwnership === 'leasehold' || formData.propertyOwnership === 'share-of-freehold') && (
                      <>
                        <div className="sm:col-span-3">
                          <label htmlFor="leaseLengthRemaining" className="block text-sm font-medium leading-6 text-gray-900">
                            Lease length remaining (years)
                          </label>
                          <div className="mt-2">
                            <input
                              type="number"
                              name="leaseLengthRemaining"
                              id="leaseLengthRemaining"
                              min="0"
                              value={formData.leaseLengthRemaining}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="groundRent" className="block text-sm font-medium leading-6 text-gray-900">
                            Ground rent (£/year)
                          </label>
                          <div className="relative mt-2">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">£</span>
                            </div>
                            <input
                              type="text"
                              name="groundRent"
                              id="groundRent"
                              value={formData.groundRent}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="serviceCharge" className="block text-sm font-medium leading-6 text-gray-900">
                            Service charge (£/year)
                          </label>
                          <div className="relative mt-2">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">£</span>
                            </div>
                            <input
                              type="text"
                              name="serviceCharge"
                              id="serviceCharge"
                              value={formData.serviceCharge}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="managementCompany" className="block text-sm font-medium leading-6 text-gray-900">
                            Management company
                          </label>
                          <div className="mt-2">
                            <input
                              type="text"
                              name="managementCompany"
                              id="managementCompany"
                              value={formData.managementCompany}
                              onChange={handleInputChange}
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-[#D9E8FF] focus:ring-[#D9E8FF] sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={handleAddAnother}
                disabled={isSubmitting}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Add Another Property'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#D9E8FF]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9E8FF] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 