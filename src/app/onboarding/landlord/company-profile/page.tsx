"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon, BuildingOfficeIcon, MapPinIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AddressAutocomplete } from '../../../components/address-autocomplete';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/company-profile', status: 'current' },
  { id: '03', name: 'Property', href: '#', status: 'upcoming' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

const businessTypes = [
  { id: 'ltd', name: 'Ltd Company' },
  { id: 'partnership', name: 'Partnership' },
  { id: 'sole-trader', name: 'Sole Trader' },
  { id: 'other', name: 'Other' },
];

interface Director {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function CompanyProfile() {
  const router = useRouter();
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [townCity, setTownCity] = useState('');
  const [county, setCounty] = useState('');
  const [postcode, setPostcode] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [directors, setDirectors] = useState<Director[]>([
    { id: '1', name: '', email: '', phone: '' }
  ]);
  
  // Add a new director
  const addDirector = () => {
    const newId = (directors.length + 1).toString();
    setDirectors([...directors, { id: newId, name: '', email: '', phone: '' }]);
  };
  
  // Remove a director
  const removeDirector = (id: string) => {
    if (directors.length > 1) {
      setDirectors(directors.filter(director => director.id !== id));
    }
  };
  
  // Update director information
  const updateDirector = (id: string, field: keyof Director, value: string) => {
    setDirectors(directors.map(director => 
      director.id === id ? { ...director, [field]: value } : director
    ));
  };
  
  // Validate Companies House registration number
  const validateCompanyNumber = (number: string) => {
    // Basic validation - UK company numbers are typically 8 digits
    return /^[0-9]{8}$/.test(number);
  };
  
  // Validate VAT number
  const validateVatNumber = (number: string) => {
    // Basic UK VAT number validation (GB followed by 9 digits)
    return number === '' || /^GB[0-9]{9}$/.test(number);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!companyName || !registrationNumber || !addressLine1 || !townCity || !county || !postcode || !businessType) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (!validateCompanyNumber(registrationNumber)) {
      alert("Please enter a valid company registration number (8 digits)");
      return;
    }
    
    if (vatNumber && !validateVatNumber(vatNumber)) {
      alert("Please enter a valid VAT number (format: GB123456789)");
      return;
    }
    
    // Validate directors
    const hasEmptyDirector = directors.some(director => !director.name);
    if (hasEmptyDirector) {
      alert("Please provide a name for each director");
      return;
    }
    
    // Submit form and redirect to next step
    router.push('/onboarding/landlord/tax-information');
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    // Save form data to localStorage or API
    alert("Your company profile has been saved as draft");
  };

  return (
    <SidebarLayout 
      sidebar={<SideboardOnboardingContent />}
      isOnboarding={true}
    >
      <div className="divide-y divide-gray-900/10">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                          <CheckIconSolid aria-hidden="true" className="size-6 text-white" />
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                        <span className="text-indigo-600">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-indigo-600">{step.name}</span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  )}

                  {stepIdx !== steps.length - 1 ? (
                    <>
                      {/* Arrow separator for lg screens and up */}
                      <div aria-hidden="true" className="absolute top-0 right-0 hidden h-full w-5 md:block">
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
            <h2 className="text-base/7 font-semibold text-gray-900">Company Profile</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your company information to comply with UK regulatory requirements.
            </p>
          </div>

          <form className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2" onSubmit={handleSubmit}>
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Company Information */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Company Information</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Basic information about your company.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="company-name" className="block text-sm/6 font-medium text-gray-900">
                        Company name *
                      </label>
                      <div className="mt-2">
                        <input
                          id="company-name"
                          name="company-name"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="registration-number" className="block text-sm/6 font-medium text-gray-900">
                        Company registration number *
                      </label>
                      <div className="mt-2">
                        <input
                          id="registration-number"
                          name="registration-number"
                          type="text"
                          required
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="8 digits"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Companies House registration number
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="vat-number" className="block text-sm/6 font-medium text-gray-900">
                        VAT number (optional)
                      </label>
                      <div className="mt-2">
                        <input
                          id="vat-number"
                          name="vat-number"
                          type="text"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          placeholder="GB123456789"
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="business-type" className="block text-sm/6 font-medium text-gray-900">
                        Business type *
                      </label>
                      <div className="mt-2">
                        <select
                          id="business-type"
                          name="business-type"
                          required
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        >
                          <option value="">Select business type</option>
                          {businessTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Address */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Company Address</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Your company's registered address.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="address-line-1" className="block text-sm/6 font-medium text-gray-900">
                        Address line 1 *
                      </label>
                      <div className="mt-2">
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

                    <div className="sm:col-span-6">
                      <label htmlFor="address-line-2" className="block text-sm/6 font-medium text-gray-900">
                        Address line 2 (optional)
                      </label>
                      <div className="mt-2">
                        <input
                          id="address-line-2"
                          name="address-line-2"
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="town-city" className="block text-sm/6 font-medium text-gray-900">
                        Town/City *
                      </label>
                      <div className="mt-2">
                        <input
                          id="town-city"
                          name="town-city"
                          type="text"
                          required
                          value={townCity}
                          onChange={(e) => setTownCity(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="county" className="block text-sm/6 font-medium text-gray-900">
                        County *
                      </label>
                      <div className="mt-2">
                        <input
                          id="county"
                          name="county"
                          type="text"
                          required
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="postcode" className="block text-sm/6 font-medium text-gray-900">
                        Postcode *
                      </label>
                      <div className="mt-2">
                        <input
                          id="postcode"
                          name="postcode"
                          type="text"
                          required
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Directors */}
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">Company Director Information</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Details of company directors. At least one director is required.
                  </p>
                  
                  {directors.map((director, index) => (
                    <div key={director.id} className="mt-6 border border-gray-300 rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Director {index + 1}</h3>
                        {directors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDirector(director.id)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="size-5" aria-hidden="true" />
                            <span className="sr-only">Remove director</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <label htmlFor={`director-name-${director.id}`} className="block text-sm/6 font-medium text-gray-900">
                            Full name *
                          </label>
                          <div className="mt-2">
                            <input
                              id={`director-name-${director.id}`}
                              name={`director-name-${director.id}`}
                              type="text"
                              required
                              value={director.name}
                              onChange={(e) => updateDirector(director.id, 'name', e.target.value)}
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                          </div>
                        </div>
                        
                        <div className="sm:col-span-3">
                          <label htmlFor={`director-email-${director.id}`} className="block text-sm/6 font-medium text-gray-900">
                            Email address
                          </label>
                          <div className="mt-2">
                            <input
                              id={`director-email-${director.id}`}
                              name={`director-email-${director.id}`}
                              type="email"
                              value={director.email}
                              onChange={(e) => updateDirector(director.id, 'email', e.target.value)}
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                          </div>
                        </div>
                        
                        <div className="sm:col-span-3">
                          <label htmlFor={`director-phone-${director.id}`} className="block text-sm/6 font-medium text-gray-900">
                            Phone number
                          </label>
                          <div className="mt-2">
                            <input
                              id={`director-phone-${director.id}`}
                              name={`director-phone-${director.id}`}
                              type="tel"
                              value={director.phone}
                              onChange={(e) => updateDirector(director.id, 'phone', e.target.value)}
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={addDirector}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      <PlusIcon className="size-5 mr-1" aria-hidden="true" />
                      Add another director
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Save as Draft
              </button>
              <div className="flex gap-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-sm/6 font-semibold text-gray-900"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Save and Continue
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 