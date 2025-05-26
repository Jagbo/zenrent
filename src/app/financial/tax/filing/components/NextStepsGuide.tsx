"use client";

import React from 'react';

interface NextStepsGuideProps {
  isConnected: boolean;
}

export function NextStepsGuide({ isConnected }: NextStepsGuideProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Next Steps</h3>
      </div>
      <div className="px-4 py-4 sm:p-6">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              To submit your tax return to HMRC, you need to:
            </p>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
              <li>Connect to HMRC using the "Connect to HMRC" button above</li>
              <li>Select the relevant tax obligation from the list that will appear below</li>
              <li>Review your data and submit to HMRC</li>
            </ol>
            <div className="rounded-md bg-[#D9E8FF] p-4 text-sm">
              <p className="font-medium text-gray-900">
                We've already gathered your property information, income, and expenses from the previous steps.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Now that you're connected to HMRC, you can:
            </p>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
              <li><strong>Select an obligation</strong> from the list below</li>
              <li><strong>Review your data</strong> on the next screen</li>
              <li><strong>Submit to HMRC</strong> when you're ready</li>
            </ol>
            <div className="mt-4 rounded-md bg-[#D9E8FF] p-4">
              <h4 className="text-sm font-medium text-gray-900">Common Questions</h4>
              <dl className="mt-2 text-sm text-gray-600 space-y-3">
                <div>
                  <dt className="font-medium text-gray-900">What if my information changed?</dt>
                  <dd className="mt-1">You can go back to previous steps to update your information before submitting.</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">How do I know which obligation to select?</dt>
                  <dd className="mt-1">We'll highlight the recommended obligation based on your tax year. Usually, you'll select the one with the earliest due date.</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">What happens after I submit?</dt>
                  <dd className="mt-1">Your submission will be processed by HMRC and you'll receive a confirmation. You can view your submission history at any time.</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
