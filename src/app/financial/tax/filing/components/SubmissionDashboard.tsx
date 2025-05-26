"use client";

import React from 'react';
import { CalendarIcon, DocumentCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { TaxType } from './TaxTypeSelector';

interface Submission {
  id: string;
  taxType: TaxType;
  periodStart: string;
  periodEnd: string;
  submittedDate: string;
  status: 'success' | 'pending' | 'error';
  reference?: string;
}

interface Obligation {
  id: string;
  type: string;
  dueDate: string;
  status: string;
  taxType: TaxType;
}

interface SubmissionDashboardProps {
  submissions: Submission[];
  obligations: Obligation[];
  onStartSubmission?: (obligationId: string) => void;
  onViewSubmission?: (submissionId: string) => void;
}

export function SubmissionDashboard({
  submissions,
  obligations,
  onStartSubmission,
  onViewSubmission
}: SubmissionDashboardProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get upcoming obligations (those with status 'Open')
  const upcomingObligations = obligations.filter(
    obligation => obligation.status === 'Open'
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Get recent submissions (last 5)
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
          Submission Dashboard
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Track your submission history and upcoming deadlines
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Upcoming Deadlines</h4>
          
          {upcomingObligations.length > 0 ? (
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {upcomingObligations.map((obligation) => (
                  <li key={obligation.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-4 flex-shrink-0">
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-600">
                            {obligation.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            Due by {formatDate(obligation.dueDate)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mr-4">
                          {obligation.taxType.replace('-', ' ')}
                        </span>
                        
                        {onStartSubmission && (
                          <button
                            type="button"
                            onClick={() => onStartSubmission(obligation.id)}
                            className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                          >
                            Start Submission
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming deadlines.</p>
          )}
        </div>
        
        {/* Recent Submissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Submissions</h4>
          
          {recentSubmissions.length > 0 ? (
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {recentSubmissions.map((submission) => (
                  <li key={submission.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-4 flex-shrink-0">
                          {submission.status === 'success' ? (
                            <DocumentCheckIcon className="h-5 w-5 text-green-500" />
                          ) : submission.status === 'pending' ? (
                            <ArrowPathIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-xs">!</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {submission.taxType.replace('-', ' ')} Submission
                          </p>
                          <p className="text-sm text-gray-500">
                            Period: {formatDate(submission.periodStart)} - {formatDate(submission.periodEnd)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted: {formatDate(submission.submittedDate)}
                          </p>
                          {submission.reference && (
                            <p className="text-xs text-gray-500">
                              Ref: {submission.reference}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium mr-4 ${
                          submission.status === 'success' 
                            ? 'bg-green-50 text-green-700' 
                            : submission.status === 'pending'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-red-50 text-red-700'
                        }`}>
                          {submission.status === 'success' 
                            ? 'Successful' 
                            : submission.status === 'pending'
                              ? 'Processing'
                              : 'Failed'}
                        </span>
                        
                        {onViewSubmission && (
                          <button
                            type="button"
                            onClick={() => onViewSubmission(submission.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent submissions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
