"use client";

import React from 'react';

export function HelpSection() {
  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
          Need Help?
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">Making Tax Digital (MTD)</h4>
              <p className="mt-1 text-sm text-gray-500">
                MTD is a UK government initiative requiring digital record keeping and quarterly updates. ZenRent helps you stay compliant with these requirements.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">Contact ZenRent Support</h4>
              <p className="mt-1 text-sm text-gray-500">
                If you need assistance with using the tax assistant, please contact us at <a href="mailto:support@zenrent.co.uk" className="text-blue-600 hover:text-blue-500">support@zenrent.co.uk</a>
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">HMRC Resources</h4>
              <p className="mt-1 text-sm text-gray-500">
                Visit the <a href="https://www.gov.uk/government/collections/making-tax-digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">HMRC Making Tax Digital guidance</a> for official information about MTD requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
