"use client";

import React from 'react';
import { TaxType } from '../TaxTypeSelector';
import Link from 'next/link';

interface SubmissionResultProps {
  result: {
    success: boolean;
    message: string;
    reference?: string;
    error?: any;
  } | null;
  taxType: TaxType;
}

export function SubmissionResult({
  result,
  taxType
}: SubmissionResultProps) {
  if (!result) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing your submission...</p>
      </div>
    );
  }

  const taxTypeLabel = {
    'vat': 'VAT',
    'property-income': 'Property Income (SA105)',
    'self-assessment': 'Self Assessment'
  }[taxType];

  return (
    <div className="space-y-6">
      {result.success ? (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Submission Successful</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{result.message}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Submission Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{result.message}</p>
                {result.error && (
                  <p className="mt-2 text-xs text-red-600">
                    Error details: {typeof result.error === 'object' 
                      ? result.error.message || JSON.stringify(result.error) 
                      : result.error.toString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {result.success && result.reference && (
        <div className="bg-white p-4 border border-gray-200 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Submission Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs text-gray-500">Tax Type</h4>
              <p className="text-sm font-medium">{taxTypeLabel}</p>
            </div>
            <div>
              <h4 className="text-xs text-gray-500">Date Submitted</h4>
              <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="text-xs text-gray-500">Reference Number</h4>
              <p className="text-sm font-medium">{result.reference}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">What's Next?</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          {result.success ? (
            <>
              <li>• Your {taxTypeLabel} submission has been successfully processed by HMRC.</li>
              <li>• You can view the submission details in your submission history.</li>
              <li>• A confirmation email will be sent to your registered email address.</li>
            </>
          ) : (
            <>
              <li>• Please review the error details and try again.</li>
              <li>• If the issue persists, contact our support team for assistance.</li>
              <li>• You can save your submission as a draft and complete it later.</li>
            </>
          )}
        </ul>
      </div>

      <div className="flex justify-center space-x-4 pt-4">
        <Link 
          href="/financial/tax/filing"
          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Return to Dashboard
        </Link>
        
        {result.success && (
          <Link 
            href="/financial/tax/filing/submissions"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            View Submission History
          </Link>
        )}
        
        {!result.success && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
