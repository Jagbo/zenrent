import { SelfAssessmentService, SubmissionResult } from '../selfAssessmentService';
import { MtdSelfAssessmentApiClient, SaObligation, TaxCalculation } from '../mtdSelfAssessmentApiClient';
import { SelfAssessmentTransformer } from '../transformers/selfAssessmentTransformer';
import { FinancialData, SelfAssessmentPayload } from '../transformers/types';

// Mock the MtdSelfAssessmentApiClient
jest.mock('../mtdSelfAssessmentApiClient');

// Mock the SelfAssessmentTransformer
jest.mock('../transformers/selfAssessmentTransformer');

describe('SelfAssessmentService', () => {
  let saService: SelfAssessmentService;
  let mockSaApiClient: jest.Mocked<MtdSelfAssessmentApiClient>;
  let mockSelfAssessmentTransformer: jest.Mocked<SelfAssessmentTransformer>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    saService = new SelfAssessmentService();
    
    // Setup the mocked API client
    mockSaApiClient = new MtdSelfAssessmentApiClient() as jest.Mocked<MtdSelfAssessmentApiClient>;
    (MtdSelfAssessmentApiClient as jest.Mock).mockImplementation(() => mockSaApiClient);
    
    // Setup the mocked transformer
    mockSelfAssessmentTransformer = new SelfAssessmentTransformer() as jest.Mocked<SelfAssessmentTransformer>;
    (SelfAssessmentTransformer as jest.Mock).mockImplementation(() => mockSelfAssessmentTransformer);
  });
  
  describe('getUpcomingObligations', () => {
    it('should return upcoming obligations sorted by due date', async () => {
      // Mock obligations with different due dates and statuses
      const mockObligations: SaObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'SelfAssessment',
          periodId: '23-24'
        },
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2023-10-31',
          status: 'Overdue',
          type: 'SelfAssessment',
          periodId: 'SA-23-24'
        },
        {
          start: '2022-04-06',
          end: '2023-04-05',
          due: '2023-01-31',
          status: 'Fulfilled',
          type: 'SelfAssessment',
          periodId: '22-23',
          received: '2023-01-15'
        }
      ];
      
      // Mock the API client response
      mockSaApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await saService.getUpcomingObligations(
        'user123',
        'AB123456C',
        '2022-04-06',
        '2024-04-05'
      );
      
      // Verify the result is filtered to open/overdue and sorted by due date (ascending)
      expect(result.length).toBe(2);
      expect(result[0].periodId).toBe('SA-23-24'); // Earlier due date (Oct 31)
      expect(result[1].periodId).toBe('23-24'); // Later due date (Jan 31)
      
      // Verify the API client was called correctly
      expect(mockSaApiClient.getObligations).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2022-04-06',
        '2024-04-05'
      );
    });
  });
  
  describe('getFulfilledObligations', () => {
    it('should return fulfilled obligations sorted by received date', async () => {
      // Mock obligations with different statuses and received dates
      const mockObligations: SaObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'SelfAssessment',
          periodId: '23-24'
        },
        {
          start: '2022-04-06',
          end: '2023-04-05',
          due: '2023-01-31',
          status: 'Fulfilled',
          type: 'SelfAssessment',
          periodId: '22-23',
          received: '2023-01-15'
        },
        {
          start: '2021-04-06',
          end: '2022-04-05',
          due: '2022-01-31',
          status: 'Fulfilled',
          type: 'SelfAssessment',
          periodId: '21-22',
          received: '2022-01-20'
        }
      ];
      
      // Mock the API client response
      mockSaApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await saService.getFulfilledObligations(
        'user123',
        'AB123456C',
        '2021-04-06',
        '2024-04-05'
      );
      
      // Verify the result is filtered to fulfilled and sorted by received date (descending)
      expect(result.length).toBe(2);
      expect(result[0].periodId).toBe('22-23'); // More recent received date
      expect(result[1].periodId).toBe('21-22'); // Older received date
    });
  });
  
  describe('submitSelfAssessment', () => {
    it('should transform and submit self assessment successfully', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-04-06',
        endDate: '2024-04-05',
        transactions: []
      };
      
      // Mock transformed self assessment
      const mockSelfAssessment: SelfAssessmentPayload = {
        taxYear: '2023-24',
        income: {
          employment: [],
          selfEmployment: [],
          ukProperty: {
            fromDate: '2023-04-06',
            toDate: '2024-04-05',
            ukProperties: {
              totalIncome: 12000,
              totalExpenses: 5000,
              netProfit: 7000,
              netLoss: 0,
              properties: []
            }
          }
        }
      };
      
      // Mock transformer response
      mockSelfAssessmentTransformer.transform.mockReturnValueOnce({
        data: mockSelfAssessment,
        valid: true,
        errors: []
      });
      
      // Mock API client response
      mockSaApiClient.submitSelfAssessment.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method
      const result = await saService.submitSelfAssessment(
        'user123',
        'AB123456C',
        '2023-24',
        mockFinancialData
      );
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        reference: 'TX123456'
      });
      
      // Verify the transformer was called correctly
      expect(mockSelfAssessmentTransformer.transform).toHaveBeenCalledWith(mockFinancialData);
      
      // Verify the API client was called with the correct payload
      expect(mockSaApiClient.submitSelfAssessment).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24',
        mockSelfAssessment
      );
    });
    
    it('should handle transformation errors', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-04-06',
        endDate: '2024-04-05',
        transactions: []
      };
      
      // Mock transformer to return validation errors
      mockSelfAssessmentTransformer.transform.mockReturnValueOnce({
        data: {} as SelfAssessmentPayload,
        valid: false,
        errors: [
          { field: 'income.ukProperty.ukProperties.netProfit', message: 'Invalid amount', code: 'INVALID_AMOUNT' }
        ]
      });
      
      // Call the method
      const result = await saService.submitSelfAssessment(
        'user123',
        'AB123456C',
        '2023-24',
        mockFinancialData
      );
      
      // Verify the result
      expect(result).toEqual({
        success: false,
        errors: [
          { code: 'INVALID_AMOUNT', message: 'Invalid amount' }
        ]
      });
      
      // Verify the API client was not called
      expect(mockSaApiClient.submitSelfAssessment).not.toHaveBeenCalled();
    });
  });
  
  describe('submitCrystallization', () => {
    it('should get tax calculation and submit crystallization', async () => {
      // Mock tax calculation response
      mockSaApiClient.getTaxCalculation.mockResolvedValueOnce({
        calculationId: 'CALC123456',
        calculationTimestamp: '2023-05-01T12:00:00.000Z',
        calculationType: 'crystallisation',
        taxYear: '2023-24',
        incomeTaxAndNicsCalculated: 2000,
        totalIncomeTaxAndNicsDue: 2000,
        totalTaxable: 10000,
        incomeTax: {
          totalAmount: 2000,
          payPensionsProfit: {
            totalAmount: 2000,
            taxBands: []
          }
        },
        taxableIncome: {
          totalIncomeReceived: 12000,
          incomeReceived: {
            employment: 0,
            selfEmployment: 0,
            ukProperty: 12000,
            ukDividends: 0,
            savings: 0
          },
          totalAllowancesAndDeductions: 2000,
          allowancesAndDeductions: {
            personalAllowance: 2000,
            reducedPersonalAllowance: 0
          }
        }
      });
      
      // Mock crystallization response
      mockSaApiClient.submitCrystallization.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method
      const result = await saService.submitCrystallization(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        reference: 'TX123456'
      });
      
      // Verify both API methods were called correctly
      expect(mockSaApiClient.getTaxCalculation).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      expect(mockSaApiClient.submitCrystallization).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24',
        'CALC123456'
      );
    });
    
    it('should handle errors during tax calculation', async () => {
      // Mock tax calculation to throw an error
      mockSaApiClient.getTaxCalculation.mockRejectedValueOnce(
        new Error('Failed to calculate tax')
      );
      
      // Call the method
      const result = await saService.submitCrystallization(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toEqual({
        success: false,
        errors: [
          { code: 'SUBMISSION_FAILED', message: 'Failed to calculate tax' }
        ]
      });
      
      // Verify crystallization was not called
      expect(mockSaApiClient.submitCrystallization).not.toHaveBeenCalled();
    });
  });
  
  describe('getTaxSummary', () => {
    it('should return a formatted tax summary from the calculation', async () => {
      // Mock tax calculation response
      mockSaApiClient.getTaxCalculation.mockResolvedValueOnce({
        calculationId: 'CALC123456',
        calculationTimestamp: '2023-05-01T12:00:00.000Z',
        calculationType: 'crystallisation',
        taxYear: '2023-24',
        incomeTaxAndNicsCalculated: 2000,
        totalIncomeTaxAndNicsDue: 2000,
        totalTaxable: 10000,
        incomeTax: {
          totalAmount: 2000,
          payPensionsProfit: {
            totalAmount: 2000,
            taxBands: [
              {
                name: 'BRT',
                rate: 20,
                income: 10000,
                taxAmount: 2000
              }
            ]
          }
        },
        taxableIncome: {
          totalIncomeReceived: 12000,
          incomeReceived: {
            employment: 0,
            selfEmployment: 0,
            ukProperty: 12000,
            ukDividends: 0,
            savings: 0
          },
          totalAllowancesAndDeductions: 2000,
          allowancesAndDeductions: {
            personalAllowance: 2000,
            reducedPersonalAllowance: 0
          }
        }
      });
      
      // Call the method
      const result = await saService.getTaxSummary(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toEqual({
        totalIncome: 12000,
        totalTaxDue: 2000,
        taxableIncome: 10000,
        personalAllowance: 2000,
        taxBands: [
          {
            name: 'BRT',
            rate: 20,
            income: 10000,
            tax: 2000
          }
        ]
      });
    });
  });
  
  describe('isCrystallizationAvailable', () => {
    it('should return true when there is an open crystallization obligation', async () => {
      // Mock obligations with an open crystallization
      const mockObligations: SaObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'Crystallisation',
          periodId: 'CRYST-23-24'
        }
      ];
      
      // Mock the API client response
      mockSaApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await saService.isCrystallizationAvailable(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toBe(true);
      
      // Verify the API client was called correctly
      expect(mockSaApiClient.getObligations).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-04-06',
        '2024-04-05',
        'Crystallisation'
      );
    });
    
    it('should return false when there are no open crystallization obligations', async () => {
      // Mock obligations with no open crystallization
      const mockObligations: SaObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Fulfilled',
          type: 'Crystallisation',
          periodId: 'CRYST-23-24',
          received: '2023-12-15'
        }
      ];
      
      // Mock the API client response
      mockSaApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await saService.isCrystallizationAvailable(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toBe(false);
    });
  });
});
