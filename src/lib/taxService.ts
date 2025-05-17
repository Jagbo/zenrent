import { supabase } from "./supabase";
import { VatService } from "./services/hmrc/vatService";
import { IncomeTaxService } from "./services/hmrc/incomeTaxService";
import { SelfAssessmentService } from "./services/hmrc/selfAssessmentService";

// Types
export type Obligation = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: "Open" | "Overdue" | "Fulfilled";
  taxYear?: string;
};

export type Submission = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  submittedDate: string;
  status: "Accepted" | "Pending" | "Rejected";
  reference?: string;
  taxYear?: string;
};

export type TaxStatus = {
  vat: { status: "up-to-date" | "due-soon" | "overdue"; dueDate: string | null };
  incomeTax: { status: "up-to-date" | "due-soon" | "overdue"; dueDate: string | null };
  selfAssessment: { status: "up-to-date" | "due-soon" | "overdue"; dueDate: string | null };
};

export type MTDComplianceStatus = {
  isCompliant: boolean;
  hmrcConnected: boolean;
  digitalRecords: {
    isCompliant: boolean;
    totalTransactions: number;
    digitallyRecorded: number;
    lastUpdated: string;
  };
  quarterlyUpdates: {
    isCompliant: boolean;
    upToDate: boolean;
    nextDeadline: string | null;
  };
  mtdEligible: boolean;
  mtdMandatory: boolean;
};

/**
 * Get upcoming tax obligations for a user
 * @param userId User ID
 * @returns Array of upcoming obligations
 */
export async function getUpcomingObligations(userId: string): Promise<Obligation[]> {
  // Define mock obligations for use if API calls fail
  const mockObligations: Obligation[] = [
    {
      id: "1",
      type: "VAT",
      periodStart: "2025-01-01",
      periodEnd: "2025-03-31",
      dueDate: "2025-05-07",
      status: "Open"
    },
    {
      id: "2",
      type: "Income",
      periodStart: "2024-04-06",
      periodEnd: "2025-04-05",
      dueDate: "2026-01-31",
      status: "Open",
      taxYear: "2024-25"
    },
    {
      id: "3",
      type: "SelfAssessment",
      periodStart: "2024-04-06",
      periodEnd: "2025-04-05",
      dueDate: "2026-01-31",
      status: "Open",
      taxYear: "2024-25"
    },
    {
      id: "4",
      type: "VAT",
      periodStart: "2024-10-01",
      periodEnd: "2024-12-31",
      dueDate: "2025-02-07",
      status: "Overdue"
    }
  ];
  
  try {
    // Log for debugging
    console.log('Fetching tax obligations for userId:', userId);
    
    // In a real implementation, we would call the HMRC API services
    // For now, just return mock data
    return mockObligations;
  } catch (error) {
    console.error("Error fetching upcoming obligations:", error);
    // Return mock data as fallback
    return mockObligations;
  }
}

/**
 * Get submission history for a user
 * @param userId User ID
 * @returns Array of submissions
 */
export async function getSubmissionHistory(userId: string): Promise<Submission[]> {
  // Define mock submissions for use if API calls fail
  const mockSubmissions: Submission[] = [
    {
      id: "1",
      type: "VAT",
      periodStart: "2024-07-01",
      periodEnd: "2024-09-30",
      submittedDate: "2024-11-05",
      status: "Accepted",
      reference: "VAT-123456"
    },
    {
      id: "2",
      type: "Income",
      periodStart: "2023-04-06",
      periodEnd: "2024-04-05",
      submittedDate: "2025-01-15",
      status: "Accepted",
      reference: "IT-789012",
      taxYear: "2023-24"
    },
    {
      id: "3",
      type: "SelfAssessment",
      periodStart: "2023-04-06",
      periodEnd: "2024-04-05",
      submittedDate: "2025-01-20",
      status: "Accepted",
      reference: "SA-345678",
      taxYear: "2023-24"
    },
    {
      id: "4",
      type: "VAT",
      periodStart: "2024-04-01",
      periodEnd: "2024-06-30",
      submittedDate: "2024-08-03",
      status: "Accepted",
      reference: "VAT-567890"
    }
  ];
  
  try {
    // Log for debugging
    console.log('Fetching submission history for userId:', userId);
    
    // In a real implementation, we would call the HMRC API services
    // For now, just return mock data
    return mockSubmissions;
  } catch (error) {
    console.error("Error fetching submission history:", error);
    // Return mock data as fallback
    return mockSubmissions;
  }
}

/**
 * Get tax status summary for a user
 * @param userId User ID
 * @returns Tax status summary
 */
export async function getTaxStatus(userId: string): Promise<TaxStatus> {
  // Define mock tax status for consistent fallback
  const mockTaxStatus: TaxStatus = {
    vat: { status: "due-soon", dueDate: "2025-05-07" },
    incomeTax: { status: "up-to-date", dueDate: null },
    selfAssessment: { status: "up-to-date", dueDate: null }
  };
  
  try {
    // Log for debugging
    console.log('Fetching tax status for userId:', userId);
    
    // In a real implementation, we would analyze obligations and determine status
    // For now, just return mock data
    return mockTaxStatus;
  } catch (error) {
    console.error("Error fetching tax status:", error);
    // Return mock data as fallback
    return mockTaxStatus;
  }
}

/**
 * Submit a tax return
 * @param userId User ID
 * @param taxType Tax type (VAT, Income, SelfAssessment)
 * @param data Return data
 * @returns Submission result
 */
export async function submitTaxReturn(
  userId: string, 
  taxType: string, 
  data: any
): Promise<{ success: boolean; reference?: string; errors?: string[] }> {
  try {
    // In a real implementation, this would call the appropriate service
    // For now, return mock success
    return {
      success: true,
      reference: `${taxType.toUpperCase()}-${Math.floor(Math.random() * 1000000)}`
    };
  } catch (error) {
    console.error(`Error submitting ${taxType} return:`, error);
    return {
      success: false,
      errors: [(error as Error).message]
    };
  }
}

/**
 * Check MTD compliance status for a user
 * @param userId User ID
 * @returns MTD compliance status details
 */
export async function checkMTDCompliance(userId: string): Promise<MTDComplianceStatus> {
  // Define mock MTD compliance status for development
  const mockMTDStatus: MTDComplianceStatus = {
    isCompliant: true,
    hmrcConnected: true,
    digitalRecords: {
      isCompliant: true,
      totalTransactions: 156,
      digitallyRecorded: 156,
      lastUpdated: new Date().toISOString()
    },
    quarterlyUpdates: {
      isCompliant: true,
      upToDate: true,
      nextDeadline: "2025-08-05"
    },
    mtdEligible: true,
    mtdMandatory: true
  };
  
  try {
    // Log for debugging
    console.log('Checking MTD compliance for userId:', userId);
    
    // In a real implementation, we would check:
    // 1. If the user has connected to HMRC
    // 2. If they have digital records for all transactions
    // 3. If they're up to date with quarterly submissions
    // 4. If they're eligible or mandated for MTD
    
    // For now, just return mock data
    return mockMTDStatus;
  } catch (error) {
    console.error("Error checking MTD compliance:", error);
    // Return mock data as fallback with non-compliant status
    return {
      ...mockMTDStatus,
      isCompliant: false,
      hmrcConnected: false,
      digitalRecords: {
        ...mockMTDStatus.digitalRecords,
        isCompliant: false
      },
      quarterlyUpdates: {
        ...mockMTDStatus.quarterlyUpdates,
        isCompliant: false,
        upToDate: false
      }
    };
  }
}

/**
 * Submit a quarterly MTD update
 * @param userId User ID
 * @param taxType Tax type (VAT, Income, SelfAssessment)
 * @param periodStart Start date of the period
 * @param periodEnd End date of the period
 * @param data Update data
 * @returns Submission result
 */
export async function submitQuarterlyUpdate(
  userId: string,
  taxType: string,
  periodStart: string,
  periodEnd: string,
  data: any
): Promise<{ success: boolean; reference?: string; errors?: string[] }> {
  try {
    // Log for debugging
    console.log(`Submitting quarterly ${taxType} update for period ${periodStart} to ${periodEnd}`);
    
    // In a real implementation, this would call the appropriate service based on tax type
    // For now, return mock success
    return {
      success: true,
      reference: `MTD-${taxType.toUpperCase()}-${Math.floor(Math.random() * 1000000)}`
    };
  } catch (error) {
    console.error(`Error submitting quarterly ${taxType} update:`, error);
    return {
      success: false,
      errors: [(error as Error).message]
    };
  }
}
