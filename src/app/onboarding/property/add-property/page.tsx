"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AddressAutocomplete } from '../../../components/address-autocomplete';

const steps = [
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
  
  // Load saved properties on component mount
  useEffect(() => {
    try {
      const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      if (existingProperties.length > 0) {
        setSavedProperties(existingProperties);
        setPropertyCount(existingProperties.length + 1);
      }
    } catch (error) {
      console.error("Error loading saved properties:", error);
    }
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      if (name === 'isHmo') {
        setFormData({
          ...formData,
          [name]: (e.target as HTMLInputElement).checked
        });
      } else if (name.startsWith('features-') || name.startsWith('hmoSharedFacilities-')) {
        const field = name.startsWith('features-') ? 'features' : 'hmoSharedFacilities';
        const feature = name.split('-')[1];
        const isChecked = (e.target as HTMLInputElement).checked;
        
        if (isChecked) {
          setFormData({
            ...formData,
            [field]: [...formData[field as keyof typeof formData] as string[], feature]
          });
        } else {
          setFormData({
            ...formData,
            [field]: (formData[field as keyof typeof formData] as string[]).filter(item => item !== feature)
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation to ensure required fields are filled
    if (!formData.address || !formData.propertyType || !formData.bedrooms || !formData.bathrooms) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Submitting property data:', formData);
    
    // Save property data to localStorage
    try {
      localStorage.setItem('propertyData', JSON.stringify(formData));
      
      // Also add to savedProperties if not already there
      const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      console.log('Existing saved properties:', existingProperties);
      
      // Check if property with same address already exists
      const existingIndex = existingProperties.findIndex((prop: any) => prop.address === formData.address);
      
      if (existingIndex === -1) {
        // Add to saved properties if it's a new property
        existingProperties.push(formData);
        localStorage.setItem('savedProperties', JSON.stringify(existingProperties));
        console.log('Updated saved properties:', existingProperties);
      } else {
        // Update existing property
        existingProperties[existingIndex] = formData;
        localStorage.setItem('savedProperties', JSON.stringify(existingProperties));
        console.log('Updated existing property in saved properties:', existingProperties);
      }
    } catch (error) {
      console.error("Error saving property data:", error);
    }
    
    // Navigate to the next step
    router.push('/onboarding/tenant/import-options');
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    // In a real application, you would save the draft here
    console.log('Form data saved as draft:', formData);
    
    // Save to localStorage
    try {
      localStorage.setItem('propertyDataDraft', JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving property draft data:", error);
    }
    
    alert('Your property details have been saved as draft');
  };
  
  // Handle add another property
  const handleAddAnother = () => {
    // Save current property and reset form
    console.log('Property saved, adding another:', formData);
    
    // Save to localStorage
    try {
      // Get existing properties array or create a new one
      const existingProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      existingProperties.push(formData);
      localStorage.setItem('savedProperties', JSON.stringify(existingProperties));
      
      // Update state with new property
      setSavedProperties(existingProperties);
      setPropertyCount(existingProperties.length + 1);
    } catch (error) {
      console.error("Error saving property:", error);
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
      <div className="divide-y divide-gray-900/10">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list" className="flex overflow-x-auto border border-gray-300 rounded-md bg-white">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIconSolid aria-hidden="true" className="size-4 sm:size-6 text-white" />
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                          <span className="text-xs sm:text-sm text-indigo-600">{step.id}</span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-indigo-600">{step.name}</span>
                      </span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                        <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator - hide on mobile, show on desktop */}
                      <div aria-hidden="true" className="absolute top-0 right-0 hidden md:block h-full w-5">
                        <svg fill="none" viewBox="0 0 22 80" preserveAspectRatio="none" className="size-full text-gray-300">
                          <path
                            d="M0 -2L20 40L0 82"
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

        <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-8 md:grid-cols-3">
          <div className="px-4 sm:px-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base/7 font-semibold text-gray-900">Add Property</h2>
            </div>
            <p className="mt-1 text-sm/6 text-gray-600">
              Enter the details of your property to add it to your portfolio.
            </p>
            
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
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
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
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="">Select status</option>
                          <option value="furnished">Furnished</option>
                          <option value="part-furnished">Part-Furnished</option>
                          <option value="unfurnished">Unfurnished</option>
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="">Select band</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                          <option value="F">F</option>
                          <option value="G">G</option>
                          <option value="H">H</option>
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor={`features-${feature.id}`} className="font-medium text-gray-900">
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
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                            className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
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
                        <div className="flex items-center">
                          <input
                            id="freehold"
                            name="propertyOwnership"
                            type="radio"
                            value="freehold"
                            checked={formData.propertyOwnership === 'freehold'}
                            onChange={handleInputChange}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <label htmlFor="freehold" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                            Freehold
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="leasehold"
                            name="propertyOwnership"
                            type="radio"
                            value="leasehold"
                            checked={formData.propertyOwnership === 'leasehold'}
                            onChange={handleInputChange}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <label htmlFor="leasehold" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                            Leasehold
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="share-of-freehold"
                            name="propertyOwnership"
                            type="radio"
                            value="share-of-freehold"
                            checked={formData.propertyOwnership === 'share-of-freehold'}
                            onChange={handleInputChange}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <label htmlFor="share-of-freehold" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                            Share of Freehold
                          </label>
                        </div>
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
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                              className="block w-full rounded-md border border-gray-300 py-1.5 pl-7 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                              className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                className="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleAddAnother}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Add Another Property
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save Property
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 