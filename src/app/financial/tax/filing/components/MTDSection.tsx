"use client";

import React, { useState, useEffect } from 'react';
import { MTDComplianceSection } from './MTDComplianceSection';
import { QuarterlyUpdatesSchedule } from './QuarterlyUpdatesSchedule';
import { DigitalRecordKeeping } from './DigitalRecordKeeping';
import { 
  getUpcomingObligations, 
  checkMTDCompliance, 
  submitQuarterlyUpdate,
  Obligation,
  MTDComplianceStatus
} from '@/lib/taxService';
import { useAuth } from '@/lib/auth-provider';
import { toast } from 'sonner';

interface MTDSectionProps {
  onConnectClick: () => void;
  isHmrcConnected: boolean | null;
  taxYear: string;
}

export function MTDSection({ 
  onConnectClick,
  isHmrcConnected,
  taxYear
}: MTDSectionProps) {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [mtdStatus, setMtdStatus] = useState<MTDComplianceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('compliance');
  
  useEffect(() => {
    async function fetchMTDData() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch obligations and MTD compliance status in parallel
        const [obligationsData, mtdComplianceData] = await Promise.all([
          getUpcomingObligations(user.id),
          checkMTDCompliance(user.id)
        ]);
        
        setObligations(obligationsData || []);
        setMtdStatus(mtdComplianceData);
      } catch (error) {
        console.error("Error fetching MTD data:", error);
        toast.error("Failed to load MTD compliance data");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMTDData();
  }, [user]);
  
  // Handle quarterly update submission
  const handleSubmitQuarterlyUpdate = async (obligation: Obligation) => {
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Submit the quarterly update
      const result = await submitQuarterlyUpdate(
        user.id,
        obligation.type,
        obligation.periodStart,
        obligation.periodEnd,
        {} // Empty data for now, in a real implementation this would contain financial data
      );
      
      if (result.success) {
        toast.success(`Successfully submitted quarterly update. Reference: ${result.reference}`);
        
        // Refresh obligations after submission
        const updatedObligations = await getUpcomingObligations(user.id);
        setObligations(updatedObligations);
      } else {
        toast.error(`Failed to submit quarterly update: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error("Error submitting quarterly update:", error);
      toast.error("An unexpected error occurred while submitting the update");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-base/7 font-cabinet-grotesk font-bold text-gray-900">
            Making Tax Digital (MTD)
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your MTD compliance and quarterly submissions
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-gray-500">Loading MTD information...</p>
            </div>
          ) : (
            <>
              {/* Tab navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {['compliance', 'quarterly', 'records'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab === 'compliance' && 'Compliance Status'}
                      {tab === 'quarterly' && 'Quarterly Updates'}
                      {tab === 'records' && 'Digital Records'}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab content */}
              <div>
                {activeTab === 'compliance' && mtdStatus && (
                  <MTDComplianceSection 
                    isHmrcConnected={isHmrcConnected} 
                    obligations={obligations}
                    taxYear={taxYear}
                    onConnectClick={onConnectClick}
                  />
                )}
                
                {activeTab === 'quarterly' && (
                  <QuarterlyUpdatesSchedule 
                    obligations={obligations}
                    taxYear={taxYear}
                  />
                )}
                
                {activeTab === 'records' && mtdStatus && (
                  <DigitalRecordKeeping 
                    isCompliant={mtdStatus.digitalRecords.isCompliant}
                    recordsSummary={mtdStatus.digitalRecords}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
