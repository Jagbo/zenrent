"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarContent } from "@/app/components/sidebar-content";
import { UpcomingObligationsWidget } from "./components/UpcomingObligationsWidget";
import { SubmissionHistoryTable } from "./components/SubmissionHistoryTable";
import { QuickActionsPanel } from "./components/QuickActionsPanel";
import { TaxStatusCard } from "./components/TaxStatusCard";
import { 
  getUpcomingObligations, 
  getSubmissionHistory, 
  getTaxStatus 
} from "@/lib/taxService";
import { useAuth } from "@/lib/auth-provider";

export default function TaxDashboardPage() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [taxStatus, setTaxStatus] = useState({
    vat: { status: "up-to-date", dueDate: null },
    incomeTax: { status: "up-to-date", dueDate: null },
    selfAssessment: { status: "up-to-date", dueDate: null }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [obligationsData, submissionsData, statusData] = await Promise.all([
          getUpcomingObligations(user.id),
          getSubmissionHistory(user.id),
          getTaxStatus(user.id)
        ]);
        
        setObligations(obligationsData || []);
        setSubmissions(submissionsData || []);
        setTaxStatus(statusData || {
          vat: { status: "up-to-date", dueDate: null },
          incomeTax: { status: "up-to-date", dueDate: null },
          selfAssessment: { status: "up-to-date", dueDate: null }
        });
      } catch (err) {
        console.error("Error fetching tax dashboard data:", err);
        setError("Failed to load tax dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user]);
  
  // Filter obligations and submissions based on active tab
  const filteredObligations = activeTab === "all" 
    ? obligations 
    : obligations.filter(obligation => obligation.type.toLowerCase() === activeTab);
    
  const filteredSubmissions = activeTab === "all"
    ? submissions
    : submissions.filter(submission => submission.type.toLowerCase() === activeTab);
  
  return (
    <SidebarLayout>
      <div>
        <header className="mb-8">
          <div className="mx-auto">
            <Heading level={1}>Tax Dashboard</Heading>
            <Text className="mt-2 text-gray-500">
              Manage your tax obligations and submissions
            </Text>
          </div>
        </header>
        
        <main>
          <div className="mx-auto">
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dashboard content */}
            <div className="space-y-8">
              {/* Tax Status Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TaxStatusCard 
                  title="VAT" 
                  status={taxStatus.vat.status} 
                  dueDate={taxStatus.vat.dueDate} 
                />
                <TaxStatusCard 
                  title="Income Tax" 
                  status={taxStatus.incomeTax.status} 
                  dueDate={taxStatus.incomeTax.dueDate} 
                />
                <TaxStatusCard 
                  title="Self Assessment" 
                  status={taxStatus.selfAssessment.status} 
                  dueDate={taxStatus.selfAssessment.dueDate} 
                />
              </div>
              
              {/* Tabs for different tax types */}
              <Tabs 
                defaultValue="all" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="vat">VAT</TabsTrigger>
                  <TabsTrigger value="income">Income Tax</TabsTrigger>
                  <TabsTrigger value="selfassessment">Self Assessment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <UpcomingObligationsWidget 
                        obligations={filteredObligations} 
                        isLoading={isLoading} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <QuickActionsPanel taxType="all" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vat" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <UpcomingObligationsWidget 
                        obligations={filteredObligations} 
                        isLoading={isLoading} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <QuickActionsPanel taxType="vat" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="income" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <UpcomingObligationsWidget 
                        obligations={filteredObligations} 
                        isLoading={isLoading} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <QuickActionsPanel taxType="income" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="selfassessment" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <UpcomingObligationsWidget 
                        obligations={filteredObligations} 
                        isLoading={isLoading} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <QuickActionsPanel taxType="selfassessment" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Submission history */}
              <SubmissionHistoryTable 
                submissions={filteredSubmissions} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
