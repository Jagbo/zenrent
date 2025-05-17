import { IncomeTaxService, SubmissionResult } from '../incomeTaxService';
import { MtdIncomeTaxApiClient, TaxObligation, TaxCalculation, EndOfPeriodStatementPayload } from '../mtdIncomeTaxApiClient';
import { PropertyIncomeTransformer } from '../transformers/propertyIncomeTransformer';
import { FinancialData, PropertyIncomePayload } from '../transformers/types';

// Mock the MtdIncomeTaxApiClient
jest.mock('../mtdIncomeTaxApiClient');

// Mock the PropertyIncomeTransformer
jest.mock('../transformers/propertyIncomeTransformer');

describe('IncomeTaxService', () => {
  let incomeTaxService: IncomeTaxService;
  let mockIncomeTaxApiClient: jest.Mocked<MtdIncomeTaxApiClient>;
  let mockPropertyIncomeTransformer: jest.Mocked<PropertyIncomeTransformer>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    incomeTaxService = new IncomeTaxService();
    
    // Setup the mocked API client
    mockIncomeTaxApiClient = new MtdIncomeTaxApiClient() as jest.Mocked<MtdIncomeTaxApiClient>;
    (MtdIncomeTaxApiClient as jest.Mock).mockImplementation(() => mockIncomeTaxApiClient);
    
    // Setup the mocked transformer
    mockPropertyIncomeTransformer = new PropertyIncomeTransformer() as jest.Mocked<PropertyIncomeTransformer>;
    (PropertyIncomeTransformer as jest.Mock).mockImplementation(() => mockPropertyIncomeTransformer);
  });
  
  describe('getUpcomingObligations', () => {
    it('should return upcoming obligations sorted by due date', async () => {
      // Mock obligations with different due dates and statuses
      const mockObligations: TaxObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'Crystallisation',
          periodId: '23-24'
        },
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2023-10-31',
          status: 'Overdue',
          type: 'EOPS',
          periodId: 'EOPS-23-24'
        },
        {
          start: '2022-04-06',
          end: '2023-04-05',
          due: '2023-01-31',
          status: 'Fulfilled',
          type: 'Crystallisation',
          periodId: '22-23',
          received: '2023-01-15'
        }
      ];
      
      // Mock the API client response
      mockIncomeTaxApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await incomeTaxService.getUpcomingObligations(
        'user123',
        'AB123456C',
        '2022-04-06',
        '2024-04-05'
      );
      
      // Verify the result is filtered to open/overdue and sorted by due date (ascending)
      expect(result.length).toBe(2);
      expect(result[0].periodId).toBe('EOPS-23-24'); // Earlier due date (Oct 31)
      expect(result[1].periodId).toBe('23-24'); // Later due date (Jan 31)
      
      // Verify the API client was called correctly
      expect(mockIncomeTaxApiClient.getObligations).toHaveBeenCalledWith(
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
      const mockObligations: TaxObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'Crystallisation',
          periodId: '23-24'
        },
        {
          start: '2022-04-06',
          end: '2023-04-05',
          due: '2023-01-31',
          status: 'Fulfilled',
          type: 'Crystallisation',
          periodId: '22-23',
          received: '2023-01-15'
        },
        {
          start: '2021-04-06',
          end: '2022-04-05',
          due: '2022-01-31',
          status: 'Fulfilled',
          type: 'Crystallisation',
          periodId: '21-22',
          received: '2022-01-20'
        }
      ];
      
      // Mock the API client response
      mockIncomeTaxApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await incomeTaxService.getFulfilledObligations(
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
  
  describe('submitPropertyIncome', () => {
    it('should transform and submit property income successfully', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-04-06',
        endDate: '2024-04-05',
        transactions: []
      };
      
      // Mock transformed property income
      const mockPropertyIncome: PropertyIncomePayload = {
        fromDate: '2023-04-06',
        toDate: '2024-04-05',
        ukProperties: {
          totalIncome: 12000,
          totalExpenses: 5000,
          netProfit: 7000,
          netLoss: 0,
          properties: []
        }
      };
      
      // Mock transformer response
      mockPropertyIncomeTransformer.transform.mockReturnValueOnce({
        data: mockPropertyIncome,
        valid: true,
        errors: []
      });
      
      // Mock API client response
      mockIncomeTaxApiClient.submitPropertyIncome.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method
      const result = await incomeTaxService.submitPropertyIncome(
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
      expect(mockPropertyIncomeTransformer.transform).toHaveBeenCalledWith(mockFinancialData);
      
      // Verify the API client was called with the correct payload
      expect(mockIncomeTaxApiClient.submitPropertyIncome).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24',
        mockPropertyIncome
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
      mockPropertyIncomeTransformer.transform.mockReturnValueOnce({
        data: {} as PropertyIncomePayload,
        valid: false,
        errors: [
          { field: 'ukProperties.netProfit', message: 'Invalid amount', code: 'INVALID_AMOUNT' }
        ]
      });
      
      // Call the method
      const result = await incomeTaxService.submitPropertyIncome(
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
      expect(mockIncomeTaxApiClient.submitPropertyIncome).not.toHaveBeenCalled();
    });
  });
  
  describe('submitEndOfPeriodStatement', () => {
    it('should submit end of period statement successfully', async () => {
      // Mock API client response
      mockIncomeTaxApiClient.submitEndOfPeriodStatement.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method
      const result = await incomeTaxService.submitEndOfPeriodStatement(
        'user123',
        'AB123456C',
        'PROP123',
        '2023-04-06',
        '2024-04-05',
        true
      );
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        reference: 'TX123456'
      });
      
      // Verify the API client was called with the correct payload
      expect(mockIncomeTaxApiClient.submitEndOfPeriodStatement).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        expect.objectContaining({
          typeOfBusiness: 'uk-property',
          businessId: 'PROP123',
          accountingPeriod: {
            startDate: '2023-04-06',
            endDate: '2024-04-05'
          },
          finalised: true
        })
      );
    });
    
    it('should handle foreign property type', async () => {
      // Mock API client response
      mockIncomeTaxApiClient.submitEndOfPeriodStatement.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method with isUkProperty = false
      await incomeTaxService.submitEndOfPeriodStatement(
        'user123',
        'AB123456C',
        'PROP123',
        '2023-04-06',
        '2024-04-05',
        false
      );
      
      // Verify the API client was called with foreign-property type
      expect(mockIncomeTaxApiClient.submitEndOfPeriodStatement).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        expect.objectContaining({
          typeOfBusiness: 'foreign-property'
        })
      );
    });
  });
  
  describe('submitFinalDeclaration', () => {
    it('should get tax calculation and submit final declaration', async () => {
      // Mock tax calculation response
      mockIncomeTaxApiClient.getTaxCalculation.mockResolvedValueOnce({} as TaxCalculation);
      
      // Mock final declaration response
      mockIncomeTaxApiClient.submitFinalDeclaration.mockResolvedValueOnce({
        transactionReference: 'TX123456'
      });
      
      // Call the method
      const result = await incomeTaxService.submitFinalDeclaration(
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
      expect(mockIncomeTaxApiClient.getTaxCalculation).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      expect(mockIncomeTaxApiClient.submitFinalDeclaration).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-24'
      );
    });
    
    it('should handle errors during tax calculation', async () => {
      // Mock tax calculation to throw an error
      mockIncomeTaxApiClient.getTaxCalculation.mockRejectedValueOnce(
        new Error('Failed to calculate tax')
      );
      
      // Call the method
      const result = await incomeTaxService.submitFinalDeclaration(
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
      
      // Verify final declaration was not called
      expect(mockIncomeTaxApiClient.submitFinalDeclaration).not.toHaveBeenCalled();
    });
  });
  
  describe('areAllEopsSubmitted', () => {
    it('should return true when all EOPS obligations are fulfilled', async () => {
      // Mock EOPS obligations with all fulfilled
      const mockObligations: TaxObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-05-31',
          status: 'Fulfilled',
          type: 'EOPS',
          periodId: 'EOPS-PROP1-23-24',
          received: '2024-05-15'
        },
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-05-31',
          status: 'Fulfilled',
          type: 'EOPS',
          periodId: 'EOPS-PROP2-23-24',
          received: '2024-05-20'
        }
      ];
      
      // Mock the API client response
      mockIncomeTaxApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await incomeTaxService.areAllEopsSubmitted(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toBe(true);
      
      // Verify the API client was called correctly
      expect(mockIncomeTaxApiClient.getObligations).toHaveBeenCalledWith(
        'user123',
        'AB123456C',
        '2023-04-06',
        '2024-04-05',
        'EOPS'
      );
    });
    
    it('should return false when some EOPS obligations are not fulfilled', async () => {
      // Mock EOPS obligations with some not fulfilled
      const mockObligations: TaxObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-05-31',
          status: 'Fulfilled',
          type: 'EOPS',
          periodId: 'EOPS-PROP1-23-24',
          received: '2024-05-15'
        },
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-05-31',
          status: 'Open',
          type: 'EOPS',
          periodId: 'EOPS-PROP2-23-24'
        }
      ];
      
      // Mock the API client response
      mockIncomeTaxApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await incomeTaxService.areAllEopsSubmitted(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toBe(false);
    });
  });
});
