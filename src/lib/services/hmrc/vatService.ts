import { MtdVatApiClient, VatObligation, VatLiability, VatPayment, SubmissionResponse } from './mtdVatApiClient';
import { HmrcDataTransformationService } from './transformers/dataTransformationService';
import { VatTransformer } from './transformers/vatTransformer';
import { FinancialData, VatReturnPayload } from './transformers/types';
import { CurrencyCode } from './utils/currencyUtils';

/**
 * Result of a VAT submission
 */
export interface SubmissionResult {
  success: boolean;
  reference?: string;
  processingDate?: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * VAT Service
 * Business logic layer for VAT-related operations
 */
export class VatService {
  private vatApiClient: MtdVatApiClient;
  private dataTransformationService: HmrcDataTransformationService;
  
  constructor() {
    this.vatApiClient = new MtdVatApiClient();
    this.dataTransformationService = new HmrcDataTransformationService();
  }
  
  /**
   * Get upcoming VAT obligations for a user
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getUpcomingObligations(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatObligation[]> {
    try {
      // Get open obligations (not yet fulfilled)
      const obligations = await this.vatApiClient.getObligations(userId, vrn, from, to, 'O');
      
      // Sort by due date (ascending)
      return obligations.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
    } catch (error) {
      console.error('Error getting upcoming VAT obligations:', error);
      throw error;
    }
  }
  
  /**
   * Get fulfilled VAT obligations for a user
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getFulfilledObligations(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatObligation[]> {
    try {
      // Get fulfilled obligations
      const obligations = await this.vatApiClient.getObligations(userId, vrn, from, to, 'F');
      
      // Sort by received date (descending - most recent first)
      return obligations.sort((a, b) => {
        if (!a.received || !b.received) return 0;
        return new Date(b.received).getTime() - new Date(a.received).getTime();
      });
    } catch (error) {
      console.error('Error getting fulfilled VAT obligations:', error);
      throw error;
    }
  }
  
  /**
   * Submit a VAT return for a specific period
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   * @param periodKey - Period key from obligations
   * @param financialData - Financial data for the period
   */
  async submitVatReturn(
    userId: string,
    vrn: string,
    periodKey: string,
    financialData: FinancialData
  ): Promise<SubmissionResult> {
    try {
      // 1. Transform financial data to VAT return format
      const vatTransformer = new VatTransformer({
        currencyCode: CurrencyCode.GBP,
        validateOutput: true,
        userId
      });
      
      const transformationResult = vatTransformer.transform(financialData);
      
      // Check if transformation was successful
      if (!transformationResult.valid) {
        return {
          success: false,
          errors: transformationResult.errors.map(err => ({
            code: err.code,
            message: err.message
          }))
        };
      }
      
      // Set the period key from the obligation
      const vatReturn: VatReturnPayload = {
        ...transformationResult.data,
        periodKey
      };
      
      // 2. Submit to HMRC
      const response = await this.vatApiClient.submitVatReturn(userId, vrn, vatReturn);
      
      // 3. Return success result
      return {
        success: true,
        reference: response.formBundleNumber,
        processingDate: response.processingDate
      };
    } catch (error) {
      console.error('Error submitting VAT return:', error);
      
      // Format error for consistent response
      return {
        success: false,
        errors: [{
          code: 'SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }]
      };
    }
  }
  
  /**
   * Get VAT liabilities for a user
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getVatLiabilities(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatLiability[]> {
    try {
      const liabilities = await this.vatApiClient.getVatLiabilities(userId, vrn, from, to);
      
      // Sort by due date (descending - most recent first)
      return liabilities.sort((a, b) => new Date(b.due).getTime() - new Date(a.due).getTime());
    } catch (error) {
      console.error('Error getting VAT liabilities:', error);
      throw error;
    }
  }
  
  /**
   * Get VAT payments for a user
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getVatPayments(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatPayment[]> {
    try {
      const payments = await this.vatApiClient.getVatPayments(userId, vrn, from, to);
      
      // Sort by received date (descending - most recent first)
      return payments.sort((a, b) => new Date(b.received).getTime() - new Date(a.received).getTime());
    } catch (error) {
      console.error('Error getting VAT payments:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user has VAT obligations that need to be submitted
   * @param userId - User ID
   * @param vrn - VAT Registration Number
   */
  async hasOutstandingObligations(userId: string, vrn: string): Promise<boolean> {
    try {
      // Get date range for the last year
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      const from = oneYearAgo.toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      
      // Get open obligations
      const obligations = await this.vatApiClient.getObligations(userId, vrn, from, to, 'O');
      
      // Check if there are any obligations that are due or overdue
      return obligations.some(obligation => {
        const dueDate = new Date(obligation.due);
        return dueDate <= now;
      });
    } catch (error) {
      console.error('Error checking outstanding obligations:', error);
      // In case of error, assume there might be outstanding obligations
      return true;
    }
  }
}
