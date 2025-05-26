/**
 * Comprehensive Submission Service for HMRC Tax Returns
 * Handles draft management, validation, status tracking, and retry logic
 */

import { supabase } from '@/lib/supabase';
import { HmrcApiClient } from './hmrc/hmrcApiClient';
import { calculatePersonalTax, calculateCompanyTax, formatForHMRCSubmission } from '@/services/tax-calculator';

export interface SubmissionDraft {
  id: string;
  userId: string;
  submissionType: 'personal' | 'company';
  taxYear: string;
  draftData: any;
  validationStatus: ValidationResult;
  isValid: boolean;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness: number; // 0-100 percentage
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface SubmissionStatus {
  id: string;
  submissionId: string;
  userId: string;
  status: 'draft' | 'validating' | 'submitting' | 'submitted' | 'accepted' | 'rejected' | 'failed';
  stage: 'preparation' | 'validation' | 'transmission' | 'processing' | 'completion';
  message?: string;
  details: any;
  hmrcReference?: string;
  createdAt: string;
}

export interface SubmissionReceipt {
  id: string;
  submissionId: string;
  userId: string;
  hmrcReference: string;
  receiptType: 'acknowledgment' | 'confirmation' | 'calculation';
  receiptData: any;
  pdfUrl?: string;
  downloadedAt?: string;
  createdAt: string;
}

export class SubmissionService {
  private static instance: SubmissionService;
  private hmrcClient: HmrcApiClient;

  private constructor() {
    this.hmrcClient = new HmrcApiClient();
  }

  public static getInstance(): SubmissionService {
    if (!SubmissionService.instance) {
      SubmissionService.instance = new SubmissionService();
    }
    return SubmissionService.instance;
  }

  /**
   * Create or update a submission draft
   */
  async saveDraft(
    userId: string,
    submissionType: 'personal' | 'company',
    taxYear: string,
    draftData: any
  ): Promise<SubmissionDraft> {
    try {
      // Validate the draft data
      const validationResult = await this.validateSubmissionData(submissionType, draftData);
      
      const { data, error } = await supabase
        .from('submission_drafts')
        .upsert({
          user_id: userId,
          submission_type: submissionType,
          tax_year: taxYear,
          draft_data: draftData,
          validation_status: validationResult,
          is_valid: validationResult.isValid,
          last_saved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,submission_type,tax_year'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save draft: ${error.message}`);
      }

      return this.mapDraftFromDB(data);
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Get a submission draft
   */
  async getDraft(
    userId: string,
    submissionType: 'personal' | 'company',
    taxYear: string
  ): Promise<SubmissionDraft | null> {
    try {
      const { data, error } = await supabase
        .from('submission_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('submission_type', submissionType)
        .eq('tax_year', taxYear)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get draft: ${error.message}`);
      }

      return data ? this.mapDraftFromDB(data) : null;
    } catch (error) {
      console.error('Error getting draft:', error);
      throw error;
    }
  }

  /**
   * Get all drafts for a user
   */
  async getUserDrafts(userId: string): Promise<SubmissionDraft[]> {
    try {
      const { data, error } = await supabase
        .from('submission_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user drafts: ${error.message}`);
      }

      return data.map(this.mapDraftFromDB);
    } catch (error) {
      console.error('Error getting user drafts:', error);
      throw error;
    }
  }

  /**
   * Delete a submission draft
   */
  async deleteDraft(
    userId: string,
    submissionType: 'personal' | 'company',
    taxYear: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('submission_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('submission_type', submissionType)
        .eq('tax_year', taxYear);

      if (error) {
        throw new Error(`Failed to delete draft: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Validate submission data comprehensively
   */
  async validateSubmissionData(
    submissionType: 'personal' | 'company',
    data: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let completeness = 0;

    try {
      if (submissionType === 'personal') {
        const validation = await this.validatePersonalSubmission(data);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
        completeness = validation.completeness;
      } else {
        const validation = await this.validateCompanySubmission(data);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
        completeness = validation.completeness;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completeness
      };
    } catch (error) {
      console.error('Error validating submission data:', error);
      return {
        isValid: false,
        errors: [{
          field: 'general',
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate submission data',
          severity: 'error'
        }],
        warnings: [],
        completeness: 0
      };
    }
  }

  /**
   * Submit a draft to HMRC
   */
  async submitToHMRC(
    userId: string,
    submissionType: 'personal' | 'company',
    taxYear: string
  ): Promise<{
    success: boolean;
    submissionId?: string;
    hmrcReference?: string;
    error?: string;
  }> {
    try {
      // Get the draft
      const draft = await this.getDraft(userId, submissionType, taxYear);
      if (!draft) {
        throw new Error('No draft found for submission');
      }

      if (!draft.isValid) {
        throw new Error('Draft is not valid for submission');
      }

      // Create submission record
      const submissionId = crypto.randomUUID();
      
      // Log initial status
      await this.logSubmissionStatus(submissionId, userId, 'validating', 'validation', 'Starting final validation');

      // Final validation
      const finalValidation = await this.validateSubmissionData(submissionType, draft.draftData);
      if (!finalValidation.isValid) {
        await this.logSubmissionStatus(submissionId, userId, 'failed', 'validation', 'Final validation failed', {
          errors: finalValidation.errors
        });
        throw new Error('Final validation failed');
      }

      // Update status to submitting
      await this.logSubmissionStatus(submissionId, userId, 'submitting', 'transmission', 'Submitting to HMRC');

      // Format data for HMRC
      const hmrcData = await this.formatForHMRC(submissionType, draft.draftData, taxYear);

      // Submit to HMRC
      const hmrcResponse = await this.hmrcClient.submitIncome(userId, taxYear, hmrcData);

      if (!hmrcResponse.success) {
        await this.logSubmissionStatus(submissionId, userId, 'failed', 'transmission', 'HMRC submission failed', {
          error: hmrcResponse.error,
          errorCode: hmrcResponse.errorCode
        });
        
        // Implement retry logic for retryable errors
        if (hmrcResponse.retryable) {
          await this.scheduleRetry(submissionId, userId, submissionType, taxYear);
        }

        return {
          success: false,
          error: hmrcResponse.error
        };
      }

      // Extract HMRC reference
      const hmrcReference = hmrcResponse.data?.reference || hmrcResponse.data?.submissionId;

      // Update status to submitted
      await this.logSubmissionStatus(submissionId, userId, 'submitted', 'processing', 'Successfully submitted to HMRC', {
        hmrcReference
      }, hmrcReference);

      // Create tax submission record
      await this.createTaxSubmissionRecord(userId, submissionId, submissionType, taxYear, draft.draftData, hmrcReference);

      // Store receipt if available
      if (hmrcResponse.data?.receipt) {
        await this.storeReceipt(submissionId, userId, hmrcReference, 'acknowledgment', hmrcResponse.data.receipt);
      }

      return {
        success: true,
        submissionId,
        hmrcReference
      };

    } catch (error) {
      console.error('Error submitting to HMRC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get submission status
   */
  async getSubmissionStatus(submissionId: string, userId: string): Promise<SubmissionStatus[]> {
    try {
      const { data, error } = await supabase
        .from('submission_status_log')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get submission status: ${error.message}`);
      }

      return data.map(this.mapStatusFromDB);
    } catch (error) {
      console.error('Error getting submission status:', error);
      throw error;
    }
  }

  /**
   * Get submission receipts
   */
  async getSubmissionReceipts(submissionId: string, userId: string): Promise<SubmissionReceipt[]> {
    try {
      const { data, error } = await supabase
        .from('submission_receipts')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get submission receipts: ${error.message}`);
      }

      return data.map(this.mapReceiptFromDB);
    } catch (error) {
      console.error('Error getting submission receipts:', error);
      throw error;
    }
  }

  /**
   * Retry a failed submission
   */
  async retrySubmission(submissionId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get the latest status
      const statuses = await this.getSubmissionStatus(submissionId, userId);
      const latestStatus = statuses[statuses.length - 1];

      if (!latestStatus || latestStatus.status !== 'failed') {
        throw new Error('Submission is not in a failed state');
      }

      // Get submission details from tax_submissions
      const { data: submission, error } = await supabase
        .from('tax_submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('user_id', userId)
        .single();

      if (error || !submission) {
        throw new Error('Submission not found');
      }

      // Check retry limit
      const retryCount = submission.retry_count || 0;
      if (retryCount >= 3) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Update retry count
      await supabase
        .from('tax_submissions')
        .update({
          retry_count: retryCount + 1,
          last_retry_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      // Log retry attempt
      await this.logSubmissionStatus(submissionId, userId, 'submitting', 'transmission', `Retry attempt ${retryCount + 1}`);

      // Re-submit to HMRC
      const hmrcData = submission.calculation_data;
      const hmrcResponse = await this.hmrcClient.submitIncome(userId, submission.tax_year, hmrcData);

      if (!hmrcResponse.success) {
        await this.logSubmissionStatus(submissionId, userId, 'failed', 'transmission', 'Retry failed', {
          error: hmrcResponse.error,
          retryAttempt: retryCount + 1
        });

        return {
          success: false,
          error: hmrcResponse.error
        };
      }

      // Success - update status
      const hmrcReference = hmrcResponse.data?.reference || hmrcResponse.data?.submissionId;
      await this.logSubmissionStatus(submissionId, userId, 'submitted', 'processing', 'Retry successful', {
        hmrcReference,
        retryAttempt: retryCount + 1
      }, hmrcReference);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error retrying submission:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Private helper methods

  private async validatePersonalSubmission(data: any): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    completeness: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let completedFields = 0;
    let totalFields = 0;

    // Personal details validation
    totalFields += 5;
    if (!data.personalDetails?.firstName) {
      errors.push({
        field: 'personalDetails.firstName',
        code: 'REQUIRED_FIELD',
        message: 'First name is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.personalDetails?.lastName) {
      errors.push({
        field: 'personalDetails.lastName',
        code: 'REQUIRED_FIELD',
        message: 'Last name is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.personalDetails?.niNumber) {
      errors.push({
        field: 'personalDetails.niNumber',
        code: 'REQUIRED_FIELD',
        message: 'National Insurance number is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.personalDetails?.utr) {
      errors.push({
        field: 'personalDetails.utr',
        code: 'REQUIRED_FIELD',
        message: 'UTR is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.personalDetails?.address) {
      errors.push({
        field: 'personalDetails.address',
        code: 'REQUIRED_FIELD',
        message: 'Address is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    // Income validation
    totalFields += 2;
    if (data.income?.totalIncome === undefined || data.income?.totalIncome < 0) {
      errors.push({
        field: 'income.totalIncome',
        code: 'INVALID_VALUE',
        message: 'Total income must be a positive number',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (data.income?.totalExpenses === undefined || data.income?.totalExpenses < 0) {
      errors.push({
        field: 'income.totalExpenses',
        code: 'INVALID_VALUE',
        message: 'Total expenses must be a positive number',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    // Warnings for optimization
    if (data.income?.totalIncome > 100000 && !data.adjustments?.pensionContributions) {
      warnings.push({
        field: 'adjustments.pensionContributions',
        code: 'OPTIMIZATION_OPPORTUNITY',
        message: 'Consider pension contributions to reduce tax liability',
        suggestion: 'High earners can benefit from pension contributions'
      });
    }

    const completeness = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return { errors, warnings, completeness };
  }

  private async validateCompanySubmission(data: any): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    completeness: number;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let completedFields = 0;
    let totalFields = 0;

    // Company details validation
    totalFields += 4;
    if (!data.companyDetails?.companyName) {
      errors.push({
        field: 'companyDetails.companyName',
        code: 'REQUIRED_FIELD',
        message: 'Company name is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.companyDetails?.companyNumber) {
      errors.push({
        field: 'companyDetails.companyNumber',
        code: 'REQUIRED_FIELD',
        message: 'Company number is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.companyDetails?.utr) {
      errors.push({
        field: 'companyDetails.utr',
        code: 'REQUIRED_FIELD',
        message: 'UTR is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (!data.companyDetails?.accountingPeriod) {
      errors.push({
        field: 'companyDetails.accountingPeriod',
        code: 'REQUIRED_FIELD',
        message: 'Accounting period is required',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    // Financial data validation
    totalFields += 2;
    if (data.financials?.totalIncome === undefined || data.financials?.totalIncome < 0) {
      errors.push({
        field: 'financials.totalIncome',
        code: 'INVALID_VALUE',
        message: 'Total income must be a positive number',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    if (data.financials?.totalExpenses === undefined || data.financials?.totalExpenses < 0) {
      errors.push({
        field: 'financials.totalExpenses',
        code: 'INVALID_VALUE',
        message: 'Total expenses must be a positive number',
        severity: 'error'
      });
    } else {
      completedFields++;
    }

    const completeness = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return { errors, warnings, completeness };
  }

  private async formatForHMRC(submissionType: 'personal' | 'company', data: any, taxYear: string): Promise<any> {
    if (submissionType === 'personal') {
      // Prepare income data
      const income = {
        rentIncome: data.income?.totalIncome || 0,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };
      
      // Prepare expenses data
      const expenses = {
        premisesRunningCosts: data.income?.totalExpenses || 0,
        repairsAndMaintenance: 0,
        financialCosts: 0,
        professionalFees: 0,
        costOfServices: 0,
        other: 0
      };
      
      // Prepare adjustments with defaults
      const adjustments = {
        useMileageAllowance: data.adjustments?.useMileageAllowance || false,
        mileageTotal: data.adjustments?.mileageTotal || 0,
        usePropertyIncomeAllowance: data.adjustments?.usePropertyIncomeAllowance || false,
        priorYearLosses: data.adjustments?.priorYearLosses || 0,
        capitalAllowances: data.adjustments?.capitalAllowances || 0,
        wearAndTearAllowance: data.adjustments?.wearAndTearAllowance || 0
      };
      
      // Calculate tax and format for HMRC
      const calculation = calculatePersonalTax(income, expenses, adjustments);
      
      return formatForHMRCSubmission(calculation, taxYear);
    } else {
      // Calculate company tax using the correct signature
      const calculation = calculateCompanyTax(
        data.financials?.totalIncome || 0,
        data.financials?.totalExpenses || 0,
        data.adjustments || 0
      );
      
      // Use the company-specific formatter
      return {
        taxYear,
        companyTax: {
          totalProfit: Math.round(calculation.totalProfit * 100),
          allowableExpenses: Math.round(calculation.allowableExpenses * 100),
          taxableProfit: Math.round(calculation.taxableProfit * 100),
          corporationTax: Math.round(calculation.corporationTax * 100),
          totalTaxDue: Math.round(calculation.totalTaxDue * 100)
        },
        calculation
      };
    }
  }

  private async logSubmissionStatus(
    submissionId: string,
    userId: string,
    status: string,
    stage: string,
    message: string,
    details: any = {},
    hmrcReference?: string
  ): Promise<void> {
    try {
      await supabase
        .from('submission_status_log')
        .insert({
          submission_id: submissionId,
          user_id: userId,
          status,
          stage,
          message,
          details,
          hmrc_reference: hmrcReference
        });
    } catch (error) {
      console.error('Error logging submission status:', error);
    }
  }

  private async storeReceipt(
    submissionId: string,
    userId: string,
    hmrcReference: string,
    receiptType: string,
    receiptData: any
  ): Promise<void> {
    try {
      await supabase
        .from('submission_receipts')
        .insert({
          submission_id: submissionId,
          user_id: userId,
          hmrc_reference: hmrcReference,
          receipt_type: receiptType,
          receipt_data: receiptData
        });
    } catch (error) {
      console.error('Error storing receipt:', error);
    }
  }

  private async createTaxSubmissionRecord(
    userId: string,
    submissionId: string,
    submissionType: string,
    taxYear: string,
    calculationData: any,
    hmrcReference?: string
  ): Promise<void> {
    try {
      await supabase
        .from('tax_submissions')
        .insert({
          id: submissionId,
          user_id: userId,
          tax_year: taxYear,
          submission_type: submissionType,
          calculation_data: calculationData,
          submission_status: 'submitted',
          submission_stage: 'processing',
          hmrc_reference: hmrcReference,
          submitted_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating tax submission record:', error);
    }
  }

  private async scheduleRetry(
    submissionId: string,
    userId: string,
    submissionType: string,
    taxYear: string
  ): Promise<void> {
    // In a production environment, this would schedule a background job
    // For now, we'll just log that a retry should be scheduled
    console.log(`Scheduling retry for submission ${submissionId}`);
    
    // Could implement with a job queue like Bull or similar
    // setTimeout(() => {
    //   this.retrySubmission(submissionId, userId);
    // }, 60000); // Retry after 1 minute
  }

  // Mapping functions
  private mapDraftFromDB(data: any): SubmissionDraft {
    return {
      id: data.id,
      userId: data.user_id,
      submissionType: data.submission_type,
      taxYear: data.tax_year,
      draftData: data.draft_data,
      validationStatus: data.validation_status,
      isValid: data.is_valid,
      lastSavedAt: data.last_saved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapStatusFromDB(data: any): SubmissionStatus {
    return {
      id: data.id,
      submissionId: data.submission_id,
      userId: data.user_id,
      status: data.status,
      stage: data.stage,
      message: data.message,
      details: data.details,
      hmrcReference: data.hmrc_reference,
      createdAt: data.created_at
    };
  }

  private mapReceiptFromDB(data: any): SubmissionReceipt {
    return {
      id: data.id,
      submissionId: data.submission_id,
      userId: data.user_id,
      hmrcReference: data.hmrc_reference,
      receiptType: data.receipt_type,
      receiptData: data.receipt_data,
      pdfUrl: data.pdf_url,
      downloadedAt: data.downloaded_at,
      createdAt: data.created_at
    };
  }
} 