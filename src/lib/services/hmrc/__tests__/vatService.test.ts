import { VatService, SubmissionResult } from '../vatService';
import { MtdVatApiClient, VatObligation, VatLiability, VatPayment } from '../mtdVatApiClient';
import { VatTransformer } from '../transformers/vatTransformer';
import { FinancialData, VatReturnPayload } from '../transformers/types';

// Mock the MtdVatApiClient
jest.mock('../mtdVatApiClient');

// Mock the VatTransformer
jest.mock('../transformers/vatTransformer');

describe('VatService', () => {
  let vatService: VatService;
  let mockVatApiClient: jest.Mocked<MtdVatApiClient>;
  let mockVatTransformer: jest.Mocked<VatTransformer>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    vatService = new VatService();
    
    // Setup the mocked API client
    mockVatApiClient = new MtdVatApiClient() as jest.Mocked<MtdVatApiClient>;
    (MtdVatApiClient as jest.Mock).mockImplementation(() => mockVatApiClient);
    
    // Setup the mocked transformer
    mockVatTransformer = new VatTransformer() as jest.Mocked<VatTransformer>;
    (VatTransformer as jest.Mock).mockImplementation(() => mockVatTransformer);
  });
  
  describe('getUpcomingObligations', () => {
    it('should return upcoming obligations sorted by due date', async () => {
      // Mock obligations with different due dates
      const mockObligations: VatObligation[] = [
        {
          start: '2023-04-01',
          end: '2023-06-30',
          due: '2023-08-07',
          status: 'O',
          periodKey: '23A2'
        },
        {
          start: '2023-01-01',
          end: '2023-03-31',
          due: '2023-05-07',
          status: 'O',
          periodKey: '23A1'
        }
      ];
      
      // Mock the API client response
      mockVatApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await vatService.getUpcomingObligations(
        'user123',
        '123456789',
        '2023-01-01',
        '2023-12-31'
      );
      
      // Verify the result is sorted by due date (ascending)
      expect(result[0].periodKey).toBe('23A1');
      expect(result[1].periodKey).toBe('23A2');
      
      // Verify the API client was called correctly
      expect(mockVatApiClient.getObligations).toHaveBeenCalledWith(
        'user123',
        '123456789',
        '2023-01-01',
        '2023-12-31',
        'O'
      );
    });
    
    it('should handle errors when fetching obligations', async () => {
      // Mock API client to throw an error
      mockVatApiClient.getObligations.mockRejectedValueOnce(new Error('API error'));
      
      // Call the method and expect it to throw
      await expect(
        vatService.getUpcomingObligations('user123', '123456789', '2023-01-01', '2023-12-31')
      ).rejects.toThrow('API error');
    });
  });
  
  describe('getFulfilledObligations', () => {
    it('should return fulfilled obligations sorted by received date', async () => {
      // Mock obligations with different received dates
      const mockObligations: VatObligation[] = [
        {
          start: '2023-01-01',
          end: '2023-03-31',
          due: '2023-05-07',
          status: 'F',
          periodKey: '23A1',
          received: '2023-05-01'
        },
        {
          start: '2022-10-01',
          end: '2022-12-31',
          due: '2023-02-07',
          status: 'F',
          periodKey: '22A4',
          received: '2023-02-05'
        }
      ];
      
      // Mock the API client response
      mockVatApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await vatService.getFulfilledObligations(
        'user123',
        '123456789',
        '2022-10-01',
        '2023-12-31'
      );
      
      // Verify the result is sorted by received date (descending)
      expect(result[0].periodKey).toBe('23A1');
      expect(result[1].periodKey).toBe('22A4');
      
      // Verify the API client was called correctly
      expect(mockVatApiClient.getObligations).toHaveBeenCalledWith(
        'user123',
        '123456789',
        '2022-10-01',
        '2023-12-31',
        'F'
      );
    });
  });
  
  describe('submitVatReturn', () => {
    it('should transform and submit VAT return successfully', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        transactions: []
      };
      
      // Mock transformed VAT return
      const mockVatReturn: VatReturnPayload = {
        periodKey: '',  // Will be set by the service
        vatDueSales: 1000.00,
        vatDueAcquisitions: 0.00,
        totalVatDue: 1000.00,
        vatReclaimedCurrPeriod: 500.00,
        netVatDue: 500.00,
        totalValueSalesExVAT: 5000.00,
        totalValuePurchasesExVAT: 2500.00,
        totalValueGoodsSuppliedExVAT: 0.00,
        totalAcquisitionsExVAT: 0.00,
        finalised: true
      };
      
      // Mock transformer response
      mockVatTransformer.transform.mockReturnValueOnce({
        data: mockVatReturn,
        valid: true,
        errors: []
      });
      
      // Mock API client response
      mockVatApiClient.submitVatReturn.mockResolvedValueOnce({
        processingDate: '2023-05-07T12:00:00.000Z',
        formBundleNumber: 'FB123456'
      });
      
      // Call the method
      const result = await vatService.submitVatReturn(
        'user123',
        '123456789',
        '23A1',
        mockFinancialData
      );
      
      // Verify the result
      expect(result).toEqual({
        success: true,
        reference: 'FB123456',
        processingDate: '2023-05-07T12:00:00.000Z'
      });
      
      // Verify the transformer was called correctly
      expect(mockVatTransformer.transform).toHaveBeenCalledWith(mockFinancialData);
      
      // Verify the API client was called with the correct VAT return
      expect(mockVatApiClient.submitVatReturn).toHaveBeenCalledWith(
        'user123',
        '123456789',
        expect.objectContaining({
          ...mockVatReturn,
          periodKey: '23A1'
        })
      );
    });
    
    it('should handle transformation errors', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        transactions: []
      };
      
      // Mock transformer to return validation errors
      mockVatTransformer.transform.mockReturnValueOnce({
        data: {} as VatReturnPayload,
        valid: false,
        errors: [
          { field: 'vatDueSales', message: 'Invalid amount', code: 'INVALID_AMOUNT' }
        ]
      });
      
      // Call the method
      const result = await vatService.submitVatReturn(
        'user123',
        '123456789',
        '23A1',
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
      expect(mockVatApiClient.submitVatReturn).not.toHaveBeenCalled();
    });
    
    it('should handle API errors during submission', async () => {
      // Mock financial data
      const mockFinancialData: FinancialData = {
        userId: 'user123',
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        transactions: []
      };
      
      // Mock transformed VAT return
      const mockVatReturn: VatReturnPayload = {
        periodKey: '',
        vatDueSales: 1000.00,
        vatDueAcquisitions: 0.00,
        totalVatDue: 1000.00,
        vatReclaimedCurrPeriod: 500.00,
        netVatDue: 500.00,
        totalValueSalesExVAT: 5000.00,
        totalValuePurchasesExVAT: 2500.00,
        totalValueGoodsSuppliedExVAT: 0.00,
        totalAcquisitionsExVAT: 0.00,
        finalised: true
      };
      
      // Mock transformer response
      mockVatTransformer.transform.mockReturnValueOnce({
        data: mockVatReturn,
        valid: true,
        errors: []
      });
      
      // Mock API client to throw an error
      mockVatApiClient.submitVatReturn.mockRejectedValueOnce(
        new Error('API submission error')
      );
      
      // Call the method
      const result = await vatService.submitVatReturn(
        'user123',
        '123456789',
        '23A1',
        mockFinancialData
      );
      
      // Verify the result
      expect(result).toEqual({
        success: false,
        errors: [
          { code: 'SUBMISSION_FAILED', message: 'API submission error' }
        ]
      });
    });
  });
  
  describe('hasOutstandingObligations', () => {
    it('should return true when there are due obligations', async () => {
      // Mock current date to 2023-05-10
      jest.useFakeTimers().setSystemTime(new Date('2023-05-10'));
      
      // Mock obligations with one that's due
      const mockObligations: VatObligation[] = [
        {
          start: '2023-01-01',
          end: '2023-03-31',
          due: '2023-05-07', // This is overdue
          status: 'O',
          periodKey: '23A1'
        }
      ];
      
      // Mock the API client response
      mockVatApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await vatService.hasOutstandingObligations('user123', '123456789');
      
      // Verify the result
      expect(result).toBe(true);
      
      // Restore real timers
      jest.useRealTimers();
    });
    
    it('should return false when there are no due obligations', async () => {
      // Mock current date to 2023-05-01
      jest.useFakeTimers().setSystemTime(new Date('2023-05-01'));
      
      // Mock obligations with none that are due yet
      const mockObligations: VatObligation[] = [
        {
          start: '2023-01-01',
          end: '2023-03-31',
          due: '2023-05-07', // This is not yet due
          status: 'O',
          periodKey: '23A1'
        }
      ];
      
      // Mock the API client response
      mockVatApiClient.getObligations.mockResolvedValueOnce(mockObligations);
      
      // Call the method
      const result = await vatService.hasOutstandingObligations('user123', '123456789');
      
      // Verify the result
      expect(result).toBe(false);
      
      // Restore real timers
      jest.useRealTimers();
    });
    
    it('should handle errors and return true by default', async () => {
      // Mock API client to throw an error
      mockVatApiClient.getObligations.mockRejectedValueOnce(new Error('API error'));
      
      // Call the method
      const result = await vatService.hasOutstandingObligations('user123', '123456789');
      
      // Verify the result (should default to true in case of error)
      expect(result).toBe(true);
    });
  });
});
