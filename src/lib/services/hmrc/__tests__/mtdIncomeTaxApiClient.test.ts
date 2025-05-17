import { MtdIncomeTaxApiClient, TaxObligation, TaxCalculation, EndOfPeriodStatementPayload } from '../mtdIncomeTaxApiClient';
import { HmrcAuthService } from '../hmrcAuthService';
import { PropertyIncomePayload } from '../transformers/types';

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

describe('MtdIncomeTaxApiClient', () => {
  let incomeTaxApiClient: MtdIncomeTaxApiClient;
  let mockAuthService: jest.Mocked<HmrcAuthService>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    incomeTaxApiClient = new MtdIncomeTaxApiClient();
    
    // Get the mocked auth service
    mockAuthService = HmrcAuthService.getInstance() as jest.Mocked<HmrcAuthService>;
    
    // Setup the executeWithRetry mock to call the provided function with a token
    mockAuthService.executeWithRetry.mockImplementation(
      async (userId, apiCall) => await apiCall('mock-token')
    );
  });
  
  describe('getObligations', () => {
    it('should fetch income tax obligations successfully', async () => {
      // Mock response data
      const mockObligations: TaxObligation[] = [
        {
          start: '2023-04-06',
          end: '2024-04-05',
          due: '2024-01-31',
          status: 'Open',
          type: 'Crystallisation',
          periodId: '23-24'
        }
      ];
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ obligations: mockObligations })
      });
      
      // Call the method
      const result = await incomeTaxApiClient.getObligations(
        'user123',
        'AB123456C',
        '2023-04-06',
        '2024-04-05'
      );
      
      // Verify the result
      expect(result).toEqual(mockObligations);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/individuals\/income-tax\/obligations\/AB123456C\?from=2023-04-06&to=2024-04-05/),
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
        incomeTaxApiClient.getObligations('user123', 'AB123456C', '2023-04-06', '2024-04-05')
      ).rejects.toThrow('HMRC Income Tax API Error');
    });
  });
  
  describe('submitPropertyIncome', () => {
    it('should submit property income successfully', async () => {
      // Mock property income payload
      const mockPayload: PropertyIncomePayload = {
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
      
      // Mock submission response
      const mockResponse = {
        transactionReference: 'TX123456'
      };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      // Call the method
      const result = await incomeTaxApiClient.submitPropertyIncome(
        'user123',
        'AB123456C',
        '2023-24',
        mockPayload
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/individuals\/income-tax\/income-sources\/property\/AB123456C\/2023-24/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.hmrc.1.0+json'
          }),
          body: JSON.stringify(mockPayload)
        })
      );
    });
    
    it('should handle validation errors when submitting property income', async () => {
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
      
      // Mock property income payload
      const mockPayload: PropertyIncomePayload = {
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
      
      // Call the method and expect it to throw
      await expect(
        incomeTaxApiClient.submitPropertyIncome('user123', 'AB123456C', '2023-24', mockPayload)
      ).rejects.toThrow('Validation error');
    });
  });
  
  describe('getTaxCalculation', () => {
    it('should trigger and fetch tax calculation successfully', async () => {
      // Mock calculation ID response
      const mockTriggerResponse = {
        calculationId: 'CALC123456'
      };
      
      // Mock calculation details response
      const mockCalculation: TaxCalculation = {
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
      };
      
      // Mock fetch responses for the three API calls
      (global.fetch as jest.Mock)
        // First call to trigger calculation
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockTriggerResponse
        })
        // Third call to get calculation details
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCalculation
        });
      
      // Call the method
      const result = await incomeTaxApiClient.getTaxCalculation(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toEqual(mockCalculation);
      
      // Verify fetch was called correctly for trigger and details
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\/individuals\/income-tax\/calculations\/AB123456C\/2023-24/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\/individuals\/income-tax\/calculations\/AB123456C\/2023-24\/CALC123456/),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
    
    it('should handle existing calculation scenario', async () => {
      // Mock fetch responses for the three API calls
      (global.fetch as jest.Mock)
        // First call to trigger calculation (409 means already exists)
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ code: 'CONFLICT', message: 'Calculation already exists' })
        })
        // Second call to list calculations
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            calculations: [
              { calculationId: 'CALC123456', timestamp: '2023-05-01T12:00:00.000Z' },
              { calculationId: 'CALC123455', timestamp: '2023-04-01T12:00:00.000Z' }
            ] 
          })
        })
        // Third call to get calculation details
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
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
          })
        });
      
      // Call the method
      await incomeTaxApiClient.getTaxCalculation('user123', 'AB123456C', '2023-24');
      
      // Verify fetch was called correctly for all three steps
      expect(global.fetch).toHaveBeenCalledTimes(3);
      // First call to trigger calculation
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\/individuals\/income-tax\/calculations\/AB123456C\/2023-24/),
        expect.any(Object)
      );
      // Second call to list calculations
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\/individuals\/income-tax\/calculations\/AB123456C\/2023-24/),
        expect.objectContaining({
          method: 'GET'
        })
      );
      // Third call to get calculation details (should use the most recent calculation ID)
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        expect.stringMatching(/\/individuals\/income-tax\/calculations\/AB123456C\/2023-24\/CALC123456/),
        expect.any(Object)
      );
    });
  });
  
  describe('submitEndOfPeriodStatement', () => {
    it('should submit end of period statement successfully', async () => {
      // Mock EOPS payload
      const mockPayload: EndOfPeriodStatementPayload = {
        typeOfBusiness: 'uk-property',
        businessId: 'PROP123',
        accountingPeriod: {
          startDate: '2023-04-06',
          endDate: '2024-04-05'
        },
        finalised: true
      };
      
      // Mock submission response
      const mockResponse = {
        transactionReference: 'TX123456'
      };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      // Call the method
      const result = await incomeTaxApiClient.submitEndOfPeriodStatement(
        'user123',
        'AB123456C',
        mockPayload
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/individuals\/income-tax\/end-of-period-statements\/AB123456C/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockPayload)
        })
      );
    });
  });
  
  describe('submitFinalDeclaration', () => {
    it('should submit final declaration successfully', async () => {
      // Mock submission response
      const mockResponse = {
        transactionReference: 'TX123456'
      };
      
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      // Call the method
      const result = await incomeTaxApiClient.submitFinalDeclaration(
        'user123',
        'AB123456C',
        '2023-24'
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/individuals\/income-tax\/final-declaration\/AB123456C\/2023-24/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({ finalised: true })
        })
      );
    });
  });
});
