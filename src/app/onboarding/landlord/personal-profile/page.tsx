"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon, UserCircleIcon, MapPinIcon, CalendarIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AddressAutocomplete } from '../../../components/address-autocomplete';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/personal-profile', status: 'current' },
  { id: '03', name: 'Property', href: '#', status: 'upcoming' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

export default function PersonalProfile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [townCity, setTownCity] = useState('');
  const [county, setCounty] = useState('');
  const [postcode, setPostcode] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  
  // Handle profile photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!dateOfBirth || !addressLine1 || !townCity || !county || !postcode) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Submit form and redirect to next step
    if (isCompany) {
      router.push('/onboarding/landlord/company-profile');
    } else {
      router.push('/onboarding/landlord/tax-information');
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    // Save form data to localStorage or API
    alert("Your profile has been saved as draft");
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
            <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF503E] group-hover:bg-[#e3402f]">
                          <CheckIconSolid aria-hidden="true" className="size-6 text-white" />
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#FF503E]">
                        <span className="text-[#FF503E]">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-[#FF503E]">{step.name}</span>
                    </a>
                  ) : (
                    <a href={step.href} className="group flex items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                          <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-500 group-hover:text-gray-900">{step.name}</span>
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
            <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">Personal Profile</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Please provide your personal information to comply with UK regulatory requirements.
            </p>
          </div>

          <form className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2" onSubmit={handleSubmit}>
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Profile Photo */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">Profile Photo</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Upload a profile photo or use your imported photo.
                  </p>
                  <div className="mt-4 flex items-center gap-x-6">
                    <div className="relative size-24 overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="size-full object-cover" />
                      ) : (
                        <UserCircleIcon className="size-16 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff"
                      >
                        <PhotoIcon className="inline-block -ml-0.5 mr-1.5 size-5 text-gray-400" aria-hidden="true" />
                        Upload photo
                      </button>
                      {profilePhoto && (
                        <button
                          type="button"
                          onClick={() => setProfilePhoto(null)}
                          className="ml-3 text-sm font-medium text-gray-900 hover:text-gray-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">Personal Information</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Required for UK compliance and identity verification.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="date-of-birth" className="block text-sm/6 font-medium text-gray-900">
                        Date of birth *
                      </label>
                      <div className="mt-2 relative">
                        <div className="relative">
                          <input
                            id="date-of-birth"
                            name="date-of-birth"
                            type="date"
                            required
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                          />
                          <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Address */}
                <div>
                  <h2 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">Current Address</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Your current residential address.
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
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
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
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
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
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
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
                          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-d9e8ff sm:text-sm/6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-gray-900 hover:text-gray-700"
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
                  className="rounded-md bg-custom-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-custom-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-d9e8ff"
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