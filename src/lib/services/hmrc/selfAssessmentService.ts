import { MtdSelfAssessmentApiClient, SaObligation, TaxCalculation, SubmissionResponse } from './mtdSelfAssessmentApiClient';
import { HmrcDataTransformationService } from './transformers/dataTransformationService';
import { SelfAssessmentTransformer } from './transformers/selfAssessmentTransformer';
import { FinancialData, SelfAssessmentPayload } from './transformers/types';
import { CurrencyCode } from './utils/currencyUtils';

/**
 * Result of a self assessment submission
 */
export interface SubmissionResult {
  success: boolean;
  reference?: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Self Assessment Service
 * Business logic layer for Self Assessment-related operations
 */
export class SelfAssessmentService {
  private saApiClient: MtdSelfAssessmentApiClient;
  private dataTransformationService: HmrcDataTransformationService;
  
  constructor() {
    this.saApiClient = new MtdSelfAssessmentApiClient();
    this.dataTransformationService = new HmrcDataTransformationService();
  }
  
  /**
   * Get upcoming self assessment obligations for a user
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getUpcomingObligations(
    userId: string,
    nino: string,
    from: string,
    to: string
  ): Promise<SaObligation[]> {
    try {
      // Get all obligations
      const obligations = await this.saApiClient.getObligations(userId, nino, from, to);
      
      // Filter to open or overdue obligations
      const upcomingObligations = obligations.filter(
        obligation => obligation.status === 'Open' || obligation.status === 'Overdue'
      );
      
      // Sort by due date (ascending)
      return upcomingObligations.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
    } catch (error) {
      console.error('Error getting upcoming self assessment obligations:', error);
      throw error;
    }
  }
  
  /**
   * Get fulfilled self assessment obligations for a user
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getFulfilledObligations(
    userId: string,
    nino: string,
    from: string,
    to: string
  ): Promise<SaObligation[]> {
    try {
      // Get all obligations
      const obligations = await this.saApiClient.getObligations(userId, nino, from, to);
      
      // Filter to fulfilled obligations
      const fulfilledObligations = obligations.filter(
        obligation => obligation.status === 'Fulfilled'
      );
      
      // Sort by received date (descending - most recent first)
      return fulfilledObligations.sort((a, b) => {
        if (!a.received || !b.received) return 0;
        return new Date(b.received).getTime() - new Date(a.received).getTime();
      });
    } catch (error) {
      console.error('Error getting fulfilled self assessment obligations:', error);
      throw error;
    }
  }
  
  /**
   * Submit self assessment for a specific tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   * @param financialData - Financial data for the period
   */
  async submitSelfAssessment(
    userId: string,
    nino: string,
    taxYear: string,
    financialData: FinancialData
  ): Promise<SubmissionResult> {
    try {
      // 1. Transform financial data to self assessment format
      const selfAssessmentTransformer = new SelfAssessmentTransformer({
        currencyCode: CurrencyCode.GBP,
        validateOutput: true,
        userId
      });
      
      const transformationResult = selfAssessmentTransformer.transform(financialData);
      
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
      
      // 2. Submit to HMRC
      const response = await this.saApiClient.submitSelfAssessment(
        userId,
        nino,
        taxYear,
        transformationResult.data
      );
      
      // 3. Return success result
      return {
        success: true,
        reference: response.transactionReference
      };
    } catch (error) {
      console.error('Error submitting self assessment:', error);
      
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
   * Get tax calculation for a user
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async getTaxCalculation(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<TaxCalculation> {
    try {
      return await this.saApiClient.getTaxCalculation(userId, nino, taxYear);
    } catch (error) {
      console.error('Error getting tax calculation:', error);
      throw error;
    }
  }
  
  /**
   * Submit crystallization for a tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async submitCrystallization(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<SubmissionResult> {
    try {
      // First, ensure a tax calculation exists and get its ID
      const calculation = await this.getTaxCalculation(userId, nino, taxYear);
      
      // Then submit the crystallization
      const response = await this.saApiClient.submitCrystallization(
        userId,
        nino,
        taxYear,
        calculation.calculationId
      );
      
      return {
        success: true,
        reference: response.transactionReference
      };
    } catch (error) {
      console.error('Error submitting crystallization:', error);
      
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
   * Check if a user has self assessment obligations that need to be submitted
   * @param userId - User ID
   * @param nino - National Insurance Number
   */
  async hasOutstandingObligations(userId: string, nino: string): Promise<boolean> {
    try {
      // Get date range for the current tax year
      const now = new Date();
      const currentYear = now.getMonth() < 4 ? now.getFullYear() - 1 : now.getFullYear();
      const startDate = `${currentYear}-04-06`;
      const endDate = `${currentYear + 1}-04-05`;
      
      // Get open or overdue obligations
      const obligations = await this.saApiClient.getObligations(userId, nino, startDate, endDate);
      
      // Check if there are any obligations that are due or overdue
      return obligations.some(obligation => {
        return obligation.status === 'Open' || obligation.status === 'Overdue';
      });
    } catch (error) {
      console.error('Error checking outstanding obligations:', error);
      // In case of error, assume there might be outstanding obligations
      return true;
    }
  }
  
  /**
   * Get a summary of the user's tax position
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async getTaxSummary(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<{
    totalIncome: number;
    totalTaxDue: number;
    taxableIncome: number;
    personalAllowance: number;
    taxBands: Array<{
      name: string;
      rate: number;
      income: number;
      tax: number;
    }>;
  }> {
    try {
      // Get the tax calculation
      const calculation = await this.getTaxCalculation(userId, nino, taxYear);
      
      // Extract the relevant information
      return {
        totalIncome: calculation.taxableIncome.totalIncomeReceived,
        totalTaxDue: calculation.totalIncomeTaxAndNicsDue,
        taxableIncome: calculation.totalTaxable,
        personalAllowance: calculation.taxableIncome.allowancesAndDeductions.personalAllowance,
        taxBands: calculation.incomeTax.payPensionsProfit.taxBands.map(band => ({
          name: band.name,
          rate: band.rate,
          income: band.income,
          tax: band.taxAmount
        }))
      };
    } catch (error) {
      console.error('Error getting tax summary:', error);
      throw error;
    }
  }
  
  /**
   * Check if crystallization is available for a tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async isCrystallizationAvailable(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<boolean> {
    try {
      // Get date range for the tax year
      const year = parseInt(taxYear.split('-')[0]);
      const startDate = `${year}-04-06`;
      const endDate = `${year + 1}-04-05`;
      
      // Get crystallization obligations
      const obligations = await this.saApiClient.getObligations(
        userId,
        nino,
        startDate,
        endDate,
        'Crystallisation'
      );
      
      // Check if there's an open crystallization obligation
      return obligations.some(obligation => obligation.status === 'Open');
    } catch (error) {
      console.error('Error checking crystallization availability:', error);
      return false;
    }
  }
}
