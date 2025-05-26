"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { CalendarIcon, CheckCircleIcon, ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { TaxType } from './TaxTypeSelector';
import { getCurrentTaxYear } from '@/hooks/useSupabaseTaxData';

interface Obligation {
  id: string;
  type: string;
  dueDate: string;
  status: string;
  taxType: TaxType;
  periodStart?: string;
  periodEnd?: string;
}

interface ComplianceData {
  status: string;
  lastUpdated: string;
  details: {
    outstandingReturns: number;
    outstandingPayments: number;
  };
}

interface ObligationsSectionProps {
  isConnected: boolean;
  obligations: Obligation[];
  compliance: ComplianceData | null;
  timestamp: string | null;
  onConnectClick: () => void;
  taxType?: TaxType;
  taxYear?: string;
  onSelectObligation?: (obligationId: string) => void;
}

export function ObligationsSection({
  isConnected,
  obligations,
  compliance,
  timestamp,
  onConnectClick,
  taxType = 'self-assessment',
  taxYear,
  onSelectObligation
}: ObligationsSectionProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [recommendedObligationId, setRecommendedObligationId] = useState<string | null>(null);
  
  // Filter obligations by tax type and status
  const filteredObligations = useMemo(() => {
    return obligations.filter(obligation => {
      // Filter by tax type
      if (taxType && obligation.taxType !== taxType) {
        return false;
      }
      
      // Filter by status if a status filter is selected
      if (statusFilter && obligation.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [obligations, taxType, statusFilter]);
  
  // Identify the recommended obligation for the current tax year
  useEffect(() => {
    if (obligations.length > 0) {
      const currentTaxYear = taxYear || getCurrentTaxYear();
      const [startYear, endYear] = currentTaxYear.split('-');
      
      // First, look for an exact match with the tax year
      let recommended = obligations.find(obligation => {
        // Check if period matches the tax year (if available)
        if (obligation.periodStart && obligation.periodEnd) {
          const periodStartYear = new Date(obligation.periodStart).getFullYear();
          const periodEndYear = new Date(obligation.periodEnd).getFullYear();
          
          return periodStartYear === parseInt(startYear) && periodEndYear === parseInt(endYear);
        }
        return false;
      });
      
      // If no exact match, find an open obligation with the earliest due date
      if (!recommended) {
        const openObligations = obligations.filter(obligation => obligation.status === 'Open');
        if (openObligations.length > 0) {
          // Sort by due date (ascending)
          openObligations.sort((a, b) => {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
          
          recommended = openObligations[0];
        }
      }
      
      // Set the recommended obligation ID
      if (recommended) {
        setRecommendedObligationId(recommended.id);
      }
    }
  }, [obligations, taxYear]);
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
      case 'Completed':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          label: 'Completed'
        };
      case 'Open':
        return {
          icon: <ClockIcon className="h-5 w-5 text-blue-500" />,
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          label: 'Open'
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
          label: status
        };
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
          View Your Obligations
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Check your quarterly update obligations and submission deadlines
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {!isConnected ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">
              Connect to HMRC to view your tax obligations and submission deadlines.
            </p>
            <button
              onClick={onConnectClick}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connect to HMRC
            </button>
          </div>
        ) : (
          <>
            {/* Compliance Status */}
            {compliance && (
              <div className="mb-6 p-4 rounded-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Compliance Status</h4>
                  <div className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    compliance.status === 'Compliant' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {compliance.status}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Outstanding Returns</p>
                    <p className="font-medium text-gray-900">{compliance.details.outstandingReturns}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Outstanding Payments</p>
                    <p className="font-medium text-gray-900">{compliance.details.outstandingPayments}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {formatDate(compliance.lastUpdated)}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex justify-end mb-4">
              <div className="relative inline-block text-left">
                <div>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    id="status-filter-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                    onClick={() => setStatusFilter(statusFilter ? null : 'Open')}
                  >
                    {statusFilter || 'All Statuses'}
                    <FunnelIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  </button>
                </div>
                {statusFilter && (
                  <button
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-500"
                    onClick={() => setStatusFilter(null)}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>
            
            {/* Obligations List */}
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {filteredObligations.length > 0 ? (
                  filteredObligations.map((obligation) => {
                    const statusDisplay = getStatusDisplay(obligation.status);
                    
                    return (
                      <li key={obligation.id} className={recommendedObligationId === obligation.id ? 'border-2 border-indigo-500 rounded-md my-2' : ''}>
                        <div className="px-4 py-4 sm:px-6">
                          {recommendedObligationId === obligation.id && (
                            <div className="mb-2 text-xs font-medium text-indigo-600">
                              ✓ Recommended for your {taxYear || getCurrentTaxYear()} tax return
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-4 flex-shrink-0">
                                {statusDisplay.icon}
                              </div>
                              <p className="truncate text-sm font-medium text-indigo-600">
                                {obligation.type}
                              </p>
                            </div>
                            <div className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
                              {statusDisplay.label}
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                              <p>
                                Due by <time dateTime={obligation.dueDate}>{formatDate(obligation.dueDate)}</time>
                              </p>
                            </div>
                            {obligation.status === 'Open' && (
                              <button
                                type="button"
                                onClick={() => onSelectObligation ? onSelectObligation(obligation.id) : router.push(`/financial/tax/filing/submit?obligation=${obligation.id}`)}
                                className="mt-3 inline-flex items-center rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                              >
                                Select & Continue
                              </button>
                            )}
                          </div>
                          {obligation.periodStart && obligation.periodEnd && (
                            <div className="mt-2 text-xs text-gray-500">
                              Period: {formatDate(obligation.periodStart)} - {formatDate(obligation.periodEnd)}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-4 py-5 text-center text-sm text-gray-500">
                    {obligations.length > 0 
                      ? `No ${taxType} obligations found with${statusFilter ? ` status '${statusFilter}'` : ''}.` 
                      : 'No obligations found for the current period.'}
                  </li>
                )}
              </ul>
            </div>
            
            {timestamp && (
              <div className="mt-4 text-xs text-gray-500 text-right">
                Data as of: {formatDate(timestamp)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
