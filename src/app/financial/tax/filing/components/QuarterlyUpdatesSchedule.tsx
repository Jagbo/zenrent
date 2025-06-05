"use client";

import React from 'react';
import { CalendarIcon, CheckCircleIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Obligation } from '@/lib/taxService';

interface QuarterlyUpdatesScheduleProps {
  obligations: Obligation[];
  taxYear: string;
}

export function QuarterlyUpdatesSchedule({ 
  obligations,
  taxYear
}: QuarterlyUpdatesScheduleProps) {
  // Group obligations by quarter
  const getQuarterlyObligations = () => {
    if (!obligations || obligations.length === 0) {
      return [];
    }
    
    // Use real obligations and sort them by period start
    return obligations
      .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
      .map((obligation, index) => {
        // Determine quarter based on period
        const startDate = new Date(obligation.periodStart);
        const quarter = Math.floor((startDate.getMonth() + 1) / 3) + 1;
        
        return {
          quarter: `Q${quarter}`,
          periodStart: obligation.periodStart,
          periodEnd: obligation.periodEnd,
          dueDate: obligation.dueDate,
          status: obligation.status,
          isReal: true,
          id: obligation.id
        };
      });
  };
  
  const quarterlyObligations = getQuarterlyObligations();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'Fulfilled':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          label: 'Submitted'
        };
      case 'Open':
        return {
          icon: <ClockIcon className="h-5 w-5 text-blue-500" />,
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          label: 'Due Soon'
        };
      case 'Overdue':
        return {
          icon: <CalendarIcon className="h-5 w-5 text-red-500" />,
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          label: 'Overdue'
        };
      default:
        return {
          icon: <ClockIcon className="h-5 w-5 text-gray-500" />,
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          label: 'Upcoming'
        };
    }
  };
  
  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
          MTD Quarterly Updates Schedule
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Making Tax Digital requires quarterly updates for the {taxYear} tax year
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {quarterlyObligations.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No obligations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No quarterly update obligations are currently available from HMRC.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This could mean:
            </p>
            <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
              <li>You haven't opted in to Making Tax Digital yet</li>
              <li>Your obligations haven't been generated yet</li>
              <li>You need to refresh your HMRC connection</li>
            </ul>
          </div>
        ) : (
          <>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {quarterlyObligations.map((obligation) => {
                  const statusDisplay = getStatusDisplay(obligation.status);
                  
                  return (
                    <li key={obligation.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-4 flex-shrink-0">
                              {statusDisplay.icon}
                            </div>
                            <p className="truncate text-sm font-medium text-indigo-600">
                              {obligation.quarter} Update
                            </p>
                          </div>
                          <div className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
                            {statusDisplay.label}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Period: {formatDate(obligation.periodStart)} - {formatDate(obligation.periodEnd)}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <p>
                              Due by <time dateTime={obligation.dueDate}>{formatDate(obligation.dueDate)}</time>
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p className="flex items-center">
                <InformationCircleIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                MTD requires quarterly updates to be submitted within one month of the quarter end date.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Information icon component
function InformationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      {...props}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  );
}
