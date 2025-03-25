"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '../../../components/sidebar-layout';
import { SideboardOnboardingContent } from '../../../components/sideboard-onboarding-content';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { PhotoIcon, DocumentIcon, VideoCameraIcon, ArrowUpTrayIcon, XMarkIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: '01', name: 'Account', href: '/sign-up/account-creation', status: 'complete' },
  { id: '02', name: 'Landlord', href: '/onboarding/landlord/tax-information', status: 'complete' },
  { id: '03', name: 'Property', href: '/onboarding/property/import-options', status: 'current' },
  { id: '04', name: 'Tenants', href: '#', status: 'upcoming' },
  { id: '05', name: 'Setup', href: '#', status: 'upcoming' },
];

export default function PropertyMedia() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);
  
  // State for media
  const [formData, setFormData] = useState({
    photos: [] as { id: string; file: File; preview: string }[],
    mainPhotoId: '',
    floorPlan: null as File | null,
    floorPlanPreview: '',
    videoLink: ''
  });
  
  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));
      
      const updatedPhotos = [...formData.photos, ...newPhotos];
      
      // If this is the first photo, set it as the main photo
      const mainPhotoId = formData.mainPhotoId || (updatedPhotos.length > 0 ? updatedPhotos[0].id : '');
      
      setFormData({
        ...formData,
        photos: updatedPhotos,
        mainPhotoId
      });
    }
  };
  
  // Handle floor plan upload
  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        floorPlan: file,
        floorPlanPreview: URL.createObjectURL(file)
      });
    }
  };
  
  // Handle video link input
  const handleVideoLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      videoLink: e.target.value
    });
  };
  
  // Handle setting main photo
  const handleSetMainPhoto = (id: string) => {
    setFormData({
      ...formData,
      mainPhotoId: id
    });
  };
  
  // Handle removing a photo
  const handleRemovePhoto = (id: string) => {
    const updatedPhotos = formData.photos.filter(photo => photo.id !== id);
    
    // If we're removing the main photo, set a new one if available
    let mainPhotoId = formData.mainPhotoId;
    if (id === formData.mainPhotoId && updatedPhotos.length > 0) {
      mainPhotoId = updatedPhotos[0].id;
    } else if (updatedPhotos.length === 0) {
      mainPhotoId = '';
    }
    
    setFormData({
      ...formData,
      photos: updatedPhotos,
      mainPhotoId
    });
  };
  
  // Handle removing floor plan
  const handleRemoveFloorPlan = () => {
    setFormData({
      ...formData,
      floorPlan: null,
      floorPlanPreview: ''
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, you would save the data here
    console.log('Form data submitted:', formData);
    
    // Navigate to the next step
    router.push('/onboarding/property/compliance');
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    // In a real application, you would save the draft here
    console.log('Form data saved as draft:', formData);
    alert('Your property media has been saved as draft');
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Trigger floor plan input click
  const triggerFloorPlanInput = () => {
    if (floorPlanInputRef.current) {
      floorPlanInputRef.current.click();
    }
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
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF503E] group-hover:bg-[#e3402f]">
                          <CheckIconSolid aria-hidden="true" className="size-6 text-white" />
                        </span>
                        <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                      </span>
                    </a>
                  ) : step.status === 'current' ? (
                    <a href={step.href} aria-current="step" className="flex items-center px-6 py-4 text-sm font-medium">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#FF503E]">
                        <span className="text-[#FF503E]">{step.id}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-[#FF503E]">{step.name}</span>
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
            <h2 className="text-base/7 font-semibold text-gray-900">Property Media</h2>
            <p className="mt-1 text-sm/6 text-gray-600">
              Upload photos, floor plans, and other media for your property.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-300 ring-1 shadow-xs ring-gray-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-4 sm:p-6">
              <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8">
                {/* Property Photos */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Property Photos</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Upload photos of your property. The first photo will be used as the main photo.
                  </p>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    
                    {formData.photos.length === 0 ? (
                      <div 
                        onClick={triggerFileInput}
                        className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                      >
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="mt-2 block text-sm font-semibold text-gray-900">Click to upload property photos</span>
                        <span className="mt-2 block text-sm text-gray-500">PNG, JPG, GIF up to 10MB</span>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {formData.photos.map((photo) => (
                            <div 
                              key={photo.id} 
                              className={`relative rounded-lg border ${photo.id === formData.mainPhotoId ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300'} overflow-hidden group`}
                            >
                              <img 
                                src={photo.preview} 
                                alt="Property" 
                                className="h-32 w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleSetMainPhoto(photo.id)}
                                  className="rounded-full bg-white p-1.5 text-gray-900 shadow-sm hover:bg-gray-50 mr-2"
                                >
                                  <ArrowsUpDownIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(photo.id)}
                                  className="rounded-full bg-white p-1.5 text-gray-900 shadow-sm hover:bg-gray-50"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                              {photo.id === formData.mainPhotoId && (
                                <div className="absolute top-0 left-0 bg-indigo-600 text-white text-xs px-2 py-1">
                                  Main Photo
                                </div>
                              )}
                            </div>
                          ))}
                          <div 
                            onClick={triggerFileInput}
                            className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 h-32 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                          >
                            <div className="text-center">
                              <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <span className="mt-2 block text-sm font-medium text-gray-900">Add more</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Click on a photo and use the buttons to set as main photo or remove.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Floor Plan */}
                <div className="border-b border-gray-900/10 pb-6">
                  <h2 className="text-base/7 font-semibold text-gray-900">Floor Plan</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Upload a floor plan for your property.
                  </p>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      ref={floorPlanInputRef}
                      onChange={handleFloorPlanUpload}
                      accept="image/*, application/pdf"
                      className="hidden"
                    />
                    
                    {!formData.floorPlan ? (
                      <div 
                        onClick={triggerFloorPlanInput}
                        className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                      >
                        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="mt-2 block text-sm font-semibold text-gray-900">Click to upload floor plan</span>
                        <span className="mt-2 block text-sm text-gray-500">PDF, PNG, JPG up to 10MB</span>
                      </div>
                    ) : (
                      <div className="relative rounded-lg border border-gray-300 overflow-hidden">
                        {formData.floorPlanPreview && (
                          <img 
                            src={formData.floorPlanPreview} 
                            alt="Floor Plan" 
                            className="h-64 w-full object-contain bg-gray-50 p-2"
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={handleRemoveFloorPlan}
                            className="rounded-full bg-white p-1.5 text-gray-900 shadow-sm hover:bg-gray-50"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-2 bg-gray-50 border-t border-gray-300">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formData.floorPlan?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(formData.floorPlan?.size && (formData.floorPlan.size / 1024 / 1024).toFixed(2)) || 0} MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Property Video */}
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">Property Video</h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Add a link to a video of your property (YouTube, Vimeo, etc.).
                  </p>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex-shrink-0">
                        <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-grow">
                        <input
                          type="text"
                          name="videoLink"
                          id="videoLink"
                          value={formData.videoLink}
                          onChange={handleVideoLinkChange}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="block w-full rounded-md border border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
                onClick={handleSaveAsDraft}
                className="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Save as Draft
              </button>
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
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}