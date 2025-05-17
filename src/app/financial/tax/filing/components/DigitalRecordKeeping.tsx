"use client";

import React from 'react';
import { CheckCircleIcon, DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline';

interface DigitalRecordKeepingProps {
  isCompliant: boolean;
  recordsSummary: {
    totalTransactions: number;
    digitallyRecorded: number;
    lastUpdated: string;
  };
}

export function DigitalRecordKeeping({ 
  isCompliant = true,
  recordsSummary = {
    totalTransactions: 0,
    digitallyRecorded: 0,
    lastUpdated: new Date().toISOString()
  }
}: DigitalRecordKeepingProps) {
  
  // Calculate compliance percentage
  const compliancePercentage = recordsSummary.totalTransactions > 0
    ? Math.round((recordsSummary.digitallyRecorded / recordsSummary.totalTransactions) * 100)
    : 100;
  
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
          Digital Record Keeping
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          MTD requires maintaining digital records of all business transactions
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Compliance Status */}
        <div className="flex items-center mb-6">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isCompliant ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isCompliant ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <DocumentTextIcon className="h-6 w-6 text-amber-600" />
            )}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900">
              {isCompliant ? 'Digital Records Compliant' : 'Digital Records Incomplete'}
            </h4>
            <p className="text-sm text-gray-500">
              {isCompliant 
                ? 'Your financial records meet MTD digital requirements' 
                : 'Some of your transactions may not be digitally recorded'}
            </p>
          </div>
        </div>
        
        {/* Records Summary */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Records Summary</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-500">Total Transactions</p>
              <p className="text-lg font-semibold">{recordsSummary.totalTransactions}</p>
            </div>
            
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-500">Digitally Recorded</p>
              <p className="text-lg font-semibold">{recordsSummary.digitallyRecorded}</p>
            </div>
            
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold">{formatDate(recordsSummary.lastUpdated)}</p>
            </div>
          </div>
          
          {/* Compliance Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-700">Digital Compliance</p>
              <p className="text-xs font-medium text-gray-700">{compliancePercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${compliancePercentage >= 100 ? 'bg-green-500' : compliancePercentage >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${compliancePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* MTD Digital Record Requirements */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-900">MTD Digital Record Requirements</h5>
          
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Business Income Records</p>
              <p className="text-xs text-gray-500">All rental income must be recorded digitally, including the date received and amount.</p>
            </div>
          </div>
          
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Business Expense Records</p>
              <p className="text-xs text-gray-500">All expenses must be categorized and recorded with dates, amounts, and descriptions.</p>
            </div>
          </div>
          
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Digital Links</p>
              <p className="text-xs text-gray-500">Data must be transferred or exchanged electronically between software programs, products, or applications.</p>
            </div>
          </div>
          
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Quarterly Submission Records</p>
              <p className="text-xs text-gray-500">Records of all quarterly submissions to HMRC must be maintained digitally.</p>
            </div>
          </div>
        </div>
        
        {/* Software Integration */}
        <div className="mt-6 bg-indigo-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <LinkIcon className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-900">
                ZenRent Digital Record Keeping
              </h5>
              <p className="mt-1 text-sm text-gray-500">
                ZenRent automatically maintains digital records of all your property transactions, ensuring MTD compliance. All data is securely stored and ready for quarterly submissions.
              </p>
              <p className="mt-2 text-sm">
                <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  View your digital records
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
