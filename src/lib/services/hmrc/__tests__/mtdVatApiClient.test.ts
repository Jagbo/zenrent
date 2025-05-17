import { MtdVatApiClient, VatObligation, VatLiability, VatPayment } from '../mtdVatApiClient';
import { HmrcAuthService } from '../hmrcAuthService';
import { VatReturnPayload } from '../transformers/types';

// Mock the HmrcAuthService
jest.mock('../hmrcAuthService', () => {
  return {
    HmrcAuthService: {
      getInstance: jest.fn().mockReturnValue({
        executeWithRetry: jest.fn()
      })
    }
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('MtdVatApiClient', () => {
  let vatApiClient: MtdVatApiClient;
  let mockAuthService: jest.Mocked<HmrcAuthService>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    vatApiClient = new MtdVatApiClient();
    
    // Get the mocked auth service
    mockAuthService = HmrcAuthService.getInstance() as jest.Mocked<HmrcAuthService>;
    
    // Setup the executeWithRetry mock to call the provided function with a token
    mockAuthService.executeWithRetry.mockImplementation(
      async (userId, apiCall) => await apiCall('mock-token')
    );
  });
  
  describe('getObligations', () => {
    it('should fetch VAT obligations successfully', async () => {
      // Mock response data
      const mockObligations: VatObligation[] = [
        {
          start: '2023-01-01',
          end: '2023-03-31',
          due: '2023-05-07',
          status: 'O',
          periodKey: '23A1'
        }
      ];
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ obligations: mockObligations })
      });
      
      // Call the method
      const result = await vatApiClient.getObligations(
        'user123',
        '123456789',
        '2023-01-01',
        '2023-12-31'
      );
      
      // Verify the result
      expect(result).toEqual(mockObligations);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/organisations\/vat\/123456789\/obligations\?from=2023-01-01&to=2023-12-31/),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Accept': 'application/vnd.hmrc.1.0+json'
          })
        })
      );
    });
    
    it('should handle errors when fetching obligations', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ code: 'INVALID_DATE_RANGE', message: 'Invalid date range' })
      });
      
      // Call the method and expect it to throw
      await expect(
        vatApiClient.getObligations('user123', '123456789', '2023-01-01', '2023-12-31')
      ).rejects.toThrow('HMRC VAT API Error');
    });
  });
  
  describe('submitVatReturn', () => {
    it('should submit VAT return successfully', async () => {
      // Mock VAT return payload
      const mockVatReturn: VatReturnPayload = {
        periodKey: '23A1',
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
      
      // Mock submission response
      const mockResponse = {
        processingDate: '2023-05-07T12:00:00.000Z',
        formBundleNumber: 'FB123456'
      };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      // Call the method
      const result = await vatApiClient.submitVatReturn(
        'user123',
        '123456789',
        mockVatReturn
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/organisations\/vat\/123456789\/returns/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.hmrc.1.0+json'
          }),
          body: JSON.stringify(mockVatReturn)
        })
      );
    });
    
    it('should handle validation errors when submitting VAT return', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ 
          code: 'VALIDATION_ERROR', 
          message: 'Validation failed',
          errors: [{ code: 'INVALID_MONETARY_AMOUNT', message: 'Invalid amount' }]
        })
      });
      
      // Mock VAT return payload
      const mockVatReturn: VatReturnPayload = {
        periodKey: '23A1',
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
      
      // Call the method and expect it to throw
      await expect(
        vatApiClient.submitVatReturn('user123', '123456789', mockVatReturn)
      ).rejects.toThrow('Validation error');
    });
  });
  
  describe('getVatLiabilities', () => {
    it('should fetch VAT liabilities successfully', async () => {
      // Mock response data
      const mockLiabilities: VatLiability[] = [
        {
          taxPeriod: {
            from: '2023-01-01',
            to: '2023-03-31'
          },
          type: 'VAT Return Debit Charge',
          originalAmount: 1000.00,
          outstandingAmount: 0.00,
          due: '2023-05-07'
        }
      ];
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ liabilities: mockLiabilities })
      });
      
      // Call the method
      const result = await vatApiClient.getVatLiabilities(
        'user123',
        '123456789',
        '2023-01-01',
        '2023-12-31'
      );
      
      // Verify the result
      expect(result).toEqual(mockLiabilities);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/organisations\/vat\/123456789\/liabilities\?from=2023-01-01&to=2023-12-31/),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });
  
  describe('getVatPayments', () => {
    it('should fetch VAT payments successfully', async () => {
      // Mock response data
      const mockPayments: VatPayment[] = [
        {
          amount: 1000.00,
          received: '2023-05-05',
          taxPeriod: {
            from: '2023-01-01',
            to: '2023-03-31'
          }
        }
      ];
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ payments: mockPayments })
      });
      
      // Call the method
      const result = await vatApiClient.getVatPayments(
        'user123',
        '123456789',
        '2023-01-01',
        '2023-12-31'
      );
      
      // Verify the result
      expect(result).toEqual(mockPayments);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/organisations\/vat\/123456789\/payments\?from=2023-01-01&to=2023-12-31/),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });
});
