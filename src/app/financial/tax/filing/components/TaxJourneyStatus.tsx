"use client";

import React from 'react';
import Link from 'next/link';

export type JourneyStage = 
  | 'not-started'
  | 'hmrc-connected'
  | 'obligations-received'
  | 'submission-in-progress'
  | 'submission-complete'
  | 'submission-accepted'
  | 'submission-rejected';

interface TaxJourneyStatusProps {
  currentStage: JourneyStage;
  taxType?: string;
  periodEnd?: string;
  dueDate?: string;
  submissionReference?: string;
}

export function TaxJourneyStatus({
  currentStage,
  taxType = 'Self Assessment',
  periodEnd,
  dueDate,
  submissionReference
}: TaxJourneyStatusProps) {
  // Define the journey stages
  const stages = [
    { id: 'not-started', name: 'Connect to HMRC', description: 'Establish secure connection with HMRC' },
    { id: 'hmrc-connected', name: 'View Obligations', description: 'See your tax deadlines and requirements' },
    { id: 'obligations-received', name: 'Prepare Submission', description: 'Complete your tax return information' },
    { id: 'submission-in-progress', name: 'Review & Submit', description: 'Verify and send your submission to HMRC' },
    { id: 'submission-complete', name: 'Await Confirmation', description: 'HMRC is processing your submission' },
    { id: 'submission-accepted', name: 'Submission Accepted', description: 'Your tax return has been accepted' }
  ];
  
  // Find the current stage index
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  
  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Your Tax Filing Journey
        </h3>
        
        <div className="mt-4">
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="h-0.5 w-full bg-gray-200">
                <div 
                  className={`h-0.5 bg-indigo-600 transition-all duration-500 ease-in-out`} 
                  style={{ width: `${Math.max(0, Math.min(100, (currentStageIndex / (stages.length - 1)) * 100))}%` }}
                />
              </div>
            </div>
            
            {/* Stage indicators */}
            <ol className="relative flex justify-between">
              {stages.map((stage, index) => {
                const isActive = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                
                return (
                  <li key={stage.id} className="relative flex items-center justify-center">
                    <div 
                      className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-indigo-600' : 'bg-gray-200'
                      } ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}
                    >
                      {index < currentStageIndex ? (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="hidden absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap sm:block">
                      <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {stage.name}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          
          {/* Current stage description */}
          <div className="mt-10 text-center sm:text-left">
            <h4 className="text-sm font-medium text-gray-900">
              {currentStageIndex >= 0 && currentStageIndex < stages.length ? stages[currentStageIndex].name : 'Unknown Stage'}
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              {currentStageIndex >= 0 && currentStageIndex < stages.length ? stages[currentStageIndex].description : ''}
            </p>
          </div>
          
          {/* Additional information based on stage */}
          {currentStage !== 'not-started' && (
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Tax Type</h5>
                  <p className="mt-1 text-sm font-medium text-gray-900">{taxType}</p>
                </div>
                
                {periodEnd && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Period End</h5>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(periodEnd)}</p>
                  </div>
                )}
                
                {dueDate && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Due Date</h5>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(dueDate)}</p>
                  </div>
                )}
                
                {submissionReference && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Submission Reference</h5>
                    <p className="mt-1 text-sm font-medium text-gray-900">{submissionReference}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action buttons based on stage */}
          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4">
            {currentStage === 'not-started' && (
              <Link 
                href="/financial/tax/filing#connect"
                className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                Connect to HMRC
              </Link>
            )}
            
            {currentStage === 'hmrc-connected' && (
              <Link 
                href="/financial/tax/filing#obligations"
                className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                View Obligations
              </Link>
            )}
            
            {currentStage === 'obligations-received' && (
              <Link 
                href={`/financial/tax/filing/submit?obligation=${submissionReference || ''}`}
                className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                Start Submission
              </Link>
            )}
            
            {currentStage === 'submission-complete' && (
              <Link 
                href="/financial/tax/filing/submissions"
                className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                View Submission Status
              </Link>
            )}
            
            {(currentStage === 'submission-accepted' || currentStage === 'submission-rejected') && (
              <>
                <Link 
                  href="/financial/tax/filing/submissions"
                  className="inline-flex items-center rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  View Submission Details
                </Link>
                <Link 
                  href="/financial/tax/filing"
                  className="mt-3 sm:mt-0 inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Start New Submission
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
