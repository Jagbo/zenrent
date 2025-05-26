"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface HmrcConnectionGuideProps {
  isConnected: boolean;
  onConnect?: () => void;
}

export function HmrcConnectionGuide({ isConnected, onConnect }: HmrcConnectionGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {isConnected ? 'Your HMRC Connection' : 'Connect to HMRC for Making Tax Digital'}
        </h3>
        
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            {isConnected 
              ? 'You are connected to HMRC Making Tax Digital. This allows you to:'
              : 'Connecting to HMRC Making Tax Digital enables you to:'}
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Submit Self Assessment tax returns directly to HMRC</li>
            <li>Report your property income as part of Self Assessment</li>
            <li>View your tax obligations and deadlines</li>
            <li>Track submission status in real-time</li>
            <li>Comply with Making Tax Digital requirements</li>
          </ul>
          
          {isExpanded && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <h4 className="font-medium text-gray-900 mb-2">What happens after connecting?</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <span className="font-medium">View Obligations:</span> Once connected, you'll see your Self Assessment obligations from HMRC, including due dates and submission periods.
                </li>
                <li>
                  <span className="font-medium">Prepare Submissions:</span> Select an obligation to prepare your Self Assessment submission with pre-populated property income data from your ZenRent account.
                </li>
                <li>
                  <span className="font-medium">Review and Submit:</span> Review your submission details before sending them directly to HMRC through our secure connection.
                </li>
                <li>
                  <span className="font-medium">Track Status:</span> Monitor the status of your submissions and receive confirmation when they're accepted by HMRC.
                </li>
              </ol>
              
              <h4 className="font-medium text-gray-900 mt-4 mb-2">About Making Tax Digital (MTD) for Self Assessment</h4>
              <p>
                MTD is HMRC's initiative to make tax administration more effective and efficient. For landlords, this means submitting your property income as part of your Self Assessment tax return through compatible software like ZenRent. Property income is reported in the UK Property section (SA105) of your Self Assessment return.
              </p>
              <p className="mt-2">
                <Link href="https://www.gov.uk/government/collections/making-tax-digital" target="_blank" className="text-indigo-600 hover:text-indigo-500">
                  Learn more about MTD on the HMRC website →
                </Link>
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isExpanded ? 'Show less' : 'Learn more about the connection process'}
          </button>
        </div>
        
        <div className="mt-5">
          {!isConnected ? (
            <button
              type="button"
              onClick={onConnect}
              className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Connect to HMRC
            </button>
          ) : (
            <div className="flex items-center">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="ml-2 text-sm font-medium text-green-700">Connected to HMRC</span>
              <Link
                href="/financial/tax/filing/submissions"
                className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Submission History →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
