import React from 'react';

export function SideboardOnboardingContent() {
  return (
    <div className="flex h-full flex-col bg-white text-gray-900 border-r border-gray-200">
      {/* Logo at the top */}
      <div className="p-8">
        <div className="flex items-center">
          <img
            src="/images/logo/ZenRent-logo.png"
            alt="ZenRent"
            className="h-10 w-auto"
          />
        </div>
      </div>
      
      {/* Content in the middle */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to ZenRent</h1>
        <p className="mt-4 text-gray-600">
          The smart way to manage your properties and streamline your rental business.
        </p>
      </div>
      
      {/* Image taking up 1/3 of the height and full width */}
      <div className="h-1/3">
        <img
          src="https://images.unsplash.com/photo-1556156653-e5a7c69cc263?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Property management illustration"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
} 