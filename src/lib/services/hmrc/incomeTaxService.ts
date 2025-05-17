import { MtdIncomeTaxApiClient, TaxObligation, TaxCalculation, EndOfPeriodStatementPayload, SubmissionResponse } from './mtdIncomeTaxApiClient';
import { HmrcDataTransformationService } from './transformers/dataTransformationService';
import { PropertyIncomeTransformer } from './transformers/propertyIncomeTransformer';
import { FinancialData, PropertyIncomePayload } from './transformers/types';
import { CurrencyCode } from './utils/currencyUtils';

/**
 * Result of a property income submission
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
 * Income Tax Service
 * Business logic layer for Income Tax-related operations
 */
export class IncomeTaxService {
  private incomeTaxApiClient: MtdIncomeTaxApiClient;
  private dataTransformationService: HmrcDataTransformationService;
  
  constructor() {
    this.incomeTaxApiClient = new MtdIncomeTaxApiClient();
    this.dataTransformationService = new HmrcDataTransformationService();
  }
  
  /**
   * Get upcoming income tax obligations for a user
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
  ): Promise<TaxObligation[]> {
    try {
      // Get all obligations
      const obligations = await this.incomeTaxApiClient.getObligations(userId, nino, from, to);
      
      // Filter to open or overdue obligations
      const upcomingObligations = obligations.filter(
        obligation => obligation.status === 'Open' || obligation.status === 'Overdue'
      );
      
      // Sort by due date (ascending)
      return upcomingObligations.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
    } catch (error) {
      console.error('Error getting upcoming income tax obligations:', error);
      throw error;
    }
  }
  
  /**
   * Get fulfilled income tax obligations for a user
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
  ): Promise<TaxObligation[]> {
    try {
      // Get all obligations
      const obligations = await this.incomeTaxApiClient.getObligations(userId, nino, from, to);
      
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
      console.error('Error getting fulfilled income tax obligations:', error);
      throw error;
    }
  }
  
  /**
   * Submit property income for a specific tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   * @param financialData - Financial data for the period
   */
  async submitPropertyIncome(
    userId: string,
    nino: string,
    taxYear: string,
    financialData: FinancialData
  ): Promise<SubmissionResult> {
    try {
      // 1. Transform financial data to property income format
      const propertyIncomeTransformer = new PropertyIncomeTransformer({
        currencyCode: CurrencyCode.GBP,
        validateOutput: true,
        userId
      });
      
      const transformationResult = propertyIncomeTransformer.transform(financialData);
      
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
      const response = await this.incomeTaxApiClient.submitPropertyIncome(
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
      console.error('Error submitting property income:', error);
      
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
      return await this.incomeTaxApiClient.getTaxCalculation(userId, nino, taxYear);
    } catch (error) {
      console.error('Error getting tax calculation:', error);
      throw error;
    }
  }
  
  /**
   * Submit end of period statement for a business
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param businessId - Business ID (usually property ID)
   * @param startDate - Start date of accounting period (YYYY-MM-DD)
   * @param endDate - End date of accounting period (YYYY-MM-DD)
   * @param isUkProperty - Whether this is UK property (true) or foreign property (false)
   */
  async submitEndOfPeriodStatement(
    userId: string,
    nino: string,
    businessId: string,
    startDate: string,
    endDate: string,
    isUkProperty = true
  ): Promise<SubmissionResult> {
    try {
      const payload: EndOfPeriodStatementPayload = {
        typeOfBusiness: isUkProperty ? 'uk-property' : 'foreign-property',
        businessId,
        accountingPeriod: {
          startDate,
          endDate
        },
        finalised: true
      };
      
      const response = await this.incomeTaxApiClient.submitEndOfPeriodStatement(userId, nino, payload);
      
      return {
        success: true,
        reference: response.transactionReference
      };
    } catch (error) {
      console.error('Error submitting end of period statement:', error);
      
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
   * Submit final declaration for a tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async submitFinalDeclaration(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<SubmissionResult> {
    try {
      // First, ensure a tax calculation exists
      await this.getTaxCalculation(userId, nino, taxYear);
      
      // Then submit the final declaration
      const response = await this.incomeTaxApiClient.submitFinalDeclaration(userId, nino, taxYear);
      
      return {
        success: true,
        reference: response.transactionReference
      };
    } catch (error) {
      console.error('Error submitting final declaration:', error);
      
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
   * Check if a user has income tax obligations that need to be submitted
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
      const obligations = await this.incomeTaxApiClient.getObligations(userId, nino, startDate, endDate);
      
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
   * Check if all end of period statements have been submitted for a tax year
   * @param userId - User ID
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async areAllEopsSubmitted(userId: string, nino: string, taxYear: string): Promise<boolean> {
    try {
      // Extract the start year from the tax year string (e.g., "2023" from "2023-24")
      const startYear = parseInt(taxYear.split('-')[0]);
      
      // Define the tax year date range
      const startDate = `${startYear}-04-06`;
      const endDate = `${startYear + 1}-04-05`;
      
      // Get all EOPS obligations
      const obligations = await this.incomeTaxApiClient.getObligations(
        userId, 
        nino, 
        startDate, 
        endDate, 
        'EOPS'
      );
      
      // Check if all EOPS obligations are fulfilled
      return obligations.every(obligation => obligation.status === 'Fulfilled');
    } catch (error) {
      console.error('Error checking EOPS status:', error);
      // In case of error, assume not all EOPS are submitted
      return false;
    }
  }
}
