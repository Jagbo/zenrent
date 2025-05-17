"use client";

import React from 'react';
import { CalendarIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Obligation } from '@/lib/taxService';

interface MTDComplianceSectionProps {
  isHmrcConnected: boolean | null;
  obligations: Obligation[];
  taxYear: string;
  onConnectClick: () => void;
}

export function MTDComplianceSection({ 
  isHmrcConnected, 
  obligations, 
  taxYear,
  onConnectClick 
}: MTDComplianceSectionProps) {
  // Calculate next quarterly deadline
  const getNextQuarterlyDeadline = () => {
    if (!obligations || obligations.length === 0) return null;
    
    const upcomingObligations = obligations
      .filter(o => o.status === "Open")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
    return upcomingObligations.length > 0 ? upcomingObligations[0] : null;
  };
  
  const nextDeadline = getNextQuarterlyDeadline();
  
  // Check if user is MTD compliant
  const isMtdCompliant = isHmrcConnected && obligations && obligations.length > 0;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
          Making Tax Digital (MTD) Compliance
        </h3>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* MTD Status */}
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isMtdCompliant ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isMtdCompliant ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900">
              {isMtdCompliant ? 'MTD Compliant' : 'MTD Compliance Required'}
            </h4>
            <p className="text-sm text-gray-500">
              {isMtdCompliant 
                ? 'Your account is set up for Making Tax Digital submissions.' 
                : 'You need to connect to HMRC to enable Making Tax Digital submissions.'}
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              {isHmrcConnected ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                HMRC Connection Status
              </h5>
              <p className="mt-1 text-sm text-gray-500">
                {isHmrcConnected 
                  ? 'Connected to HMRC for digital submissions' 
                  : 'Not connected to HMRC'}
              </p>
              {!isHmrcConnected && (
                <button
                  type="button"
                  onClick={onConnectClick}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 bg-[#D9E8FF] hover:bg-[#D9E8FF]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9E8FF]"
                >
                  Connect to HMRC
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Next Quarterly Update */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                Next Quarterly Update
              </h5>
              {nextDeadline ? (
                <div className="mt-1 text-sm text-gray-500">
                  <p>Due by: <span className="font-medium">{formatDate(nextDeadline.dueDate)}</span></p>
                  <p>Period: {formatDate(nextDeadline.periodStart)} - {formatDate(nextDeadline.periodEnd)}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  No upcoming quarterly updates found
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* MTD Information */}
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                About Making Tax Digital
              </h5>
              <p className="mt-1 text-sm text-gray-500">
                Making Tax Digital (MTD) is a UK government initiative to make tax administration more effective and efficient. It requires digital record keeping and quarterly updates for most businesses and landlords.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                <a href="https://www.gov.uk/government/collections/making-tax-digital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 font-medium">
                  Learn more about MTD requirements
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
