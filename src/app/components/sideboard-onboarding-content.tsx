import React from 'react';

export function SideboardOnboardingContent() {
  return (
    <div className="flex h-full flex-col bg-white text-gray-900 border-r border-gray-200">
      {/* Logo at the top */}
      <div className="p-8">
        <div className="flex items-center gap-2">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M3 21h18v-3H3v3zm9-14h6v3h-6V7zm0 5h6v3h-6v-3zM3 7h6v3H3V7zm0 5h6v3H3v-3z" 
              fill="currentColor"
            />
          </svg>
          <span className="text-xl font-bold text-indigo-600">ZenRent</span>
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