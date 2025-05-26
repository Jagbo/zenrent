"use client";

import React from 'react';
import Link from 'next/link';
import { TaxType } from './TaxTypeSelector';

interface SubmissionTransitionProps {
  taxType: TaxType;
  obligationData: any;
  onContinue: () => void;
  onCancel: () => void;
}

export function SubmissionTransition({
  taxType,
  obligationData,
  onContinue,
  onCancel
}: SubmissionTransitionProps) {
  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get tax type label
  const getTaxTypeLabel = (type: TaxType) => {
    switch (type) {
      case 'vat':
        return 'VAT';
      case 'property-income':
        return 'Property Income (SA105)';
      case 'self-assessment':
        return 'Self Assessment';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {getTaxTypeLabel(taxType)} Submission
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You're about to start your {getTaxTypeLabel(taxType)} submission for the period {formatDate(obligationData.startDate)} to {formatDate(obligationData.endDate)}.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              MTD Compliant
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900">What to expect in this submission process:</h4>
          
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm font-medium leading-none text-indigo-600">1</span>
                  </span>
                </div>
                <div className="ml-4">
                  <h5 className="text-sm font-medium text-gray-900">Enter your information</h5>
                  <p className="text-xs text-gray-500">
                    {taxType === 'vat' 
                      ? 'Provide your VAT figures for the period'
                      : taxType === 'self-assessment'
                      ? 'Enter your income, expenses, and adjustments'
                      : 'Enter your property income and expenses'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm font-medium leading-none text-indigo-600">2</span>
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Begin Self Assessment Submission</h3>
                  <p className="text-xs text-gray-500">
                    Verify all information is correct before submitting
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm font-medium leading-none text-indigo-600">3</span>
                  </span>
                </div>
                <div className="ml-4">
                  <h5 className="text-sm font-medium text-gray-900">Submit to HMRC</h5>
                  <p className="text-xs text-gray-500">
                    Send your submission directly to HMRC via our secure connection
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg border border-gray-300 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm font-medium leading-none text-indigo-600">4</span>
                  </span>
                </div>
                <div className="ml-4">
                  <h5 className="text-sm font-medium text-gray-900">Get confirmation</h5>
                  <p className="text-xs text-gray-500">
                    Receive confirmation and reference number from HMRC
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Begin Submission
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Making Tax Digital</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Making Tax Digital (MTD) is HMRC's initiative to make tax administration more effective and efficient through digital record-keeping and submissions.
              </p>
              <p className="mt-2">
                <Link href="https://www.gov.uk/government/collections/making-tax-digital" target="_blank" className="font-medium underline">
                  Learn more about MTD requirements
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
