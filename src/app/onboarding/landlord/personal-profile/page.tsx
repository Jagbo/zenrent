"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon, UserCircleIcon, MapPinIcon, CalendarIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AddressAutocomplete } from '../../../components/address-autocomplete';
import { supabase } from '@/lib/supabase';

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
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Get the current user and existing profile data on component mount
  useEffect(() => {
    async function getUserAndProfile() {
      try {
        // In development, use the test user ID
        if (process.env.NODE_ENV === 'development') {
          setUserId('00000000-0000-0000-0000-000000000001');
          
          // Fetch existing profile data for this user
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', '00000000-0000-0000-0000-000000000001')
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching profile:', profileError);
          }
          
          if (profileData) {
            // Pre-fill form with existing data
            setProfilePhoto(profileData.profile_photo_url);
            setDateOfBirth(profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '');
            setAddressLine1(profileData.address_line1 || '');
            setAddressLine2(profileData.address_line2 || '');
            setTownCity(profileData.town_city || '');
            setCounty(profileData.county || '');
            setPostcode(profileData.postcode || '');
            setIsCompany(profileData.is_company || false);
          }
          
          setProfileLoaded(true);
          return;
        }

        // For production
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          router.push('/sign-up'); // Redirect to sign up if no user
          return;
        }
        
        if (userData && userData.user) {
          setUserId(userData.user.id);
          
          // Fetch existing profile data for this user
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userData.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching profile:', profileError);
          }
          
          if (profileData) {
            // Pre-fill form with existing data
            setProfilePhoto(profileData.profile_photo_url);
            setDateOfBirth(profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '');
            setAddressLine1(profileData.address_line1 || '');
            setAddressLine2(profileData.address_line2 || '');
            setTownCity(profileData.town_city || '');
            setCounty(profileData.county || '');
            setPostcode(profileData.postcode || '');
            setIsCompany(profileData.is_company || false);
          }
        } else {
          router.push('/sign-up'); // Redirect to sign up if no user
        }
        
        setProfileLoaded(true);
      } catch (error) {
        console.error('Error in getUserAndProfile:', error);
        router.push('/sign-up'); // Redirect to sign up on error
      }
    }
    
    getUserAndProfile();
  }, [router]);
  
  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    try {
      // Show file in UI immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading photo:', error);
        // We continue anyway, as we'll use the base64 version temporarily
      }
      
      // If upload was successful, get public URL
      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);
        
        if (publicUrlData) {
          setProfilePhoto(publicUrlData.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error processing photo:', error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!dateOfBirth || !addressLine1 || !townCity || !county || !postcode) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (!userId) {
      setError("User authentication error. Please sign up again.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Save profile data to Supabase
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_photo_url: profilePhoto,
          date_of_birth: dateOfBirth,
          address_line1: addressLine1,
          address_line2: addressLine2,
          town_city: townCity,
          county: county,
          postcode: postcode,
          is_company: isCompany,
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) {
        throw new Error(`Failed to save profile: ${upsertError.message}`);
      }
      
      // Submit form and redirect to next step
      if (isCompany) {
        router.push('/onboarding/landlord/company-profile');
      } else {
        router.push('/onboarding/landlord/tax-information');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!userId) {
      setError("User authentication error. Please sign up again.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Save to Supabase
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_photo_url: profilePhoto,
          date_of_birth: dateOfBirth || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          town_city: townCity || null,
          county: county || null,
          postcode: postcode || null,
          is_company: isCompany,
          updated_at: new Date().toISOString()
        });
      
      if (upsertError) {
        throw new Error(`Failed to save draft: ${upsertError.message}`);
      }
      
      // Navigate to next step based on company status
      if (isCompany) {
        router.push('/onboarding/landlord/company-profile');
      } else {
        router.push('/onboarding/landlord/tax-information');
      }
    } catch (error) {
      console.error("Error saving profile draft data:", error);
      setError(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if profile is not loaded yet
  if (!profileLoaded) {
    return (
      <SidebarLayout 
        sidebar={<SideboardOnboardingContent />}
        isOnboarding={true}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading profile data...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout 
      sidebar={<SideboardOnboardingContent />}
      isOnboarding={true}
    >
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="py-0">
          <nav aria-label="Progress">
            <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white">
              {steps.map((step, stepIdx) => (
                <li key={step.name} className="relative md:flex md:flex-1">
                  {step.status === 'complete' ? (
                    <a href={step.href} className="group flex w-full items-center">
                      <span className="flex items-center px-6 py-4 text-sm font-medium">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                          <CheckIconSolid aria-hidden="true" className="size-6 text-gray-900" />
                        </span>
                        <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                        <span className="text-gray-900">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-cabinet-grotesk font-bold text-gray-900">{step.name}</span>
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
            {/* Display error message if any */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-4">
                <p>{error}</p>
              </div>
            )}
            
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
            
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-6">
              <button 
                type="button" 
                onClick={() => router.back()} 
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-gray-900"
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="rounded-md bg-d9e8ff px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-d9e8ff-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d9e8ff disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
} 