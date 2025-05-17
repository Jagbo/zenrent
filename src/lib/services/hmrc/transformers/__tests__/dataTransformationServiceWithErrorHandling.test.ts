/**
 * Tests for HMRC Data Transformation Service with Error Handling
 */

import { 
  FinancialData,
  FinancialDataType,
  TransformationOptions,
  TransformationResult,
  VatReturnPayload,
  PropertyIncomePayload,
  SelfAssessmentPayload
} from '../types';
import { HmrcDataTransformationService } from '../dataTransformationService';
import { HmrcTransformationErrorHandler } from '../transformationErrorHandler';

// Mock the transformers
jest.mock('../vatTransformer', () => ({
  VatTransformer: jest.fn().mockImplementation(() => ({
    transform: jest.fn().mockImplementation((data) => {
      if (data.metadata?.simulateError) {
        throw new Error('Simulated VAT transformer error');
      }
      return {
        data: { 
          periodKey: '23AA', 
          vatDueSales: 1000,
          vatDueAcquisitions: 0,
          totalVatDue: 1000,
          vatReclaimedCurrPeriod: 500,
          netVatDue: 500,
          totalValueSalesExVAT: 5000,
          totalValuePurchasesExVAT: 2500,
          totalValueGoodsSuppliedExVAT: 0,
          totalAcquisitionsExVAT: 0,
          finalised: true
        },
        valid: true,
        errors: []
      };
    })
  }))
}));

jest.mock('../propertyIncomeTransformer', () => ({
  PropertyIncomeTransformer: jest.fn().mockImplementation(() => ({
    transform: jest.fn().mockImplementation((data) => {
      if (data.metadata?.simulateError) {
        throw new Error('Simulated property income transformer error');
      }
      return {
        data: {
          fromDate: '2023-04-06',
          toDate: '2024-04-05',
          ukProperties: {
            totalIncome: 12000,
            totalExpenses: 5000,
            netProfit: 7000,
            netLoss: 0,
            properties: []
          }
        },
        valid: true,
        errors: []
      };
    })
  }))
}));

jest.mock('../selfAssessmentTransformer', () => ({
  SelfAssessmentTransformer: jest.fn().mockImplementation(() => ({
    transform: jest.fn().mockImplementation((data) => {
      if (data.metadata?.simulateError) {
        throw new Error('Simulated self assessment transformer error');
      }
      return {
        data: {
          taxYear: '2023-24',
          income: {
            employment: []
          }
        },
        valid: true,
        errors: []
      };
    })
  }))
}));

// Mock the validation service
jest.mock('../../validators/validationService', () => ({
  HmrcValidationService: jest.fn().mockImplementation(() => ({
    validateVatReturn: jest.fn().mockImplementation((data) => {
      if (data.periodKey === 'INVALID') {
        return {
          valid: false,
          errors: [
            { field: 'periodKey', message: 'Invalid period key format', code: 'INVALID_PERIOD_KEY' }
          ]
        };
      }
      return { valid: true, errors: [] };
    }),
    validatePropertyIncome: jest.fn().mockImplementation((data) => {
      if (data.fromDate === 'INVALID') {
        return {
          valid: false,
          errors: [
            { field: 'fromDate', message: 'Invalid date format', code: 'INVALID_DATE_FORMAT' }
          ]
        };
      }
      return { valid: true, errors: [] };
    }),
    validateSelfAssessment: jest.fn().mockImplementation((data) => {
      if (data.taxYear === 'INVALID') {
        return {
          valid: false,
          errors: [
            { field: 'taxYear', message: 'Invalid tax year format', code: 'INVALID_TAX_YEAR' }
          ]
        };
      }
      return { valid: true, errors: [] };
    })
  }))
}));

// Mock the error handler
jest.mock('../transformationErrorHandler', () => {
  // Define the type for mockErrorHandler to avoid implicit any
  type MockErrorHandler = {
    createTransformationError: jest.Mock;
    createErrorFromValidationResult: jest.Mock;
    logError: jest.Mock;
    suggestRecoveryProcedures: jest.Mock;
    getInstance: jest.Mock;
  };
  
  // Create the mock handler with proper typing
  const mockErrorHandler: MockErrorHandler = {
    createTransformationError: jest.fn().mockReturnValue({
      type: 'transformation_failed',
      message: 'Mocked error message',
      userMessage: 'User-friendly error message',
      category: 'system_error',
      recoveryActions: ['retry', 'contact_support'],
      timestamp: new Date(),
      requestId: 'mock-request-id',
      details: {}
    }),
    createErrorFromValidationResult: jest.fn().mockReturnValue({
      type: 'validation_error',
      message: 'Validation failed',
      userMessage: 'The transformed data failed validation checks',
      category: 'validation_error',
      recoveryActions: ['correct_data'],
      timestamp: new Date(),
      requestId: 'mock-validation-id',
      details: {}
    }),
    logError: jest.fn().mockResolvedValue('mock-request-id'),
    suggestRecoveryProcedures: jest.fn().mockReturnValue([
      { action: 'retry', description: 'Try again' },
      { action: 'contact_support', description: 'Contact support' }
    ]),
    getInstance: jest.fn()
  };
  
  // Set up getInstance to return the mockErrorHandler after it's fully defined
  mockErrorHandler.getInstance.mockReturnValue(mockErrorHandler);
  
  return {
    HmrcTransformationErrorHandler: mockErrorHandler
  };
});

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnValue({ data: null, error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue({ data: [], error: null })
  }
}));

describe('HmrcDataTransformationService with Error Handling', () => {
  let transformationService: HmrcDataTransformationService;
  let mockFinancialData: FinancialData;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new instance of the service for each test
    transformationService = new HmrcDataTransformationService({
      debug: true,
      logErrors: true
    });
    
    // Create mock financial data
    mockFinancialData = {
      userId: 'test-user-123',
      startDate: '2023-04-06',
      endDate: '2024-04-05',
      transactions: [
        {
          id: 'tx1',
          userId: 'test-user-123',
          amount: 1000,
          description: 'Rent payment',
          category: 'income',
          date: '2023-05-01'
        }
      ]
    };
  });
  
  describe('transform', () => {
    it('should handle unsupported transformation types with proper error handling', () => {
      // @ts-ignore - Testing with invalid input
      const result = transformationService.transform(mockFinancialData, 'UNSUPPORTED_TYPE');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe('transformation_failed');
      expect(result.metadata).toMatchObject({
        errorId: 'mock-request-id',
        recoveryActions: ['retry', 'contact_support']
      });
      
      // Verify error was created and logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createTransformationError).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
    });
    
    it('should handle transformation errors with proper error handling', () => {
      // Simulate an error in the transformer
      const dataWithError = {
        ...mockFinancialData,
        metadata: { simulateError: true }
      };
      
      const result = transformationService.transform(
        dataWithError, 
        FinancialDataType.VAT
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.metadata).toMatchObject({
        errorId: 'mock-request-id',
        recoveryActions: expect.any(Array),
        recoveryProcedures: expect.any(Array)
      });
      
      // Verify error was created, logged, and recovery procedures suggested
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createTransformationError).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
      expect(errorHandler.suggestRecoveryProcedures).toHaveBeenCalled();
    });
  });
  
  describe('transformVat', () => {
    it('should transform VAT data successfully', () => {
      const result = transformationService.transform(
        mockFinancialData, 
        FinancialDataType.VAT
      );
      
      expect(result.valid).toBe(true);
      expect(result.data).toMatchObject({
        periodKey: '23AA',
        vatDueSales: 1000,
        netVatDue: 500
      });
    });
    
    it('should handle validation errors with proper error handling', () => {
      // Mock the VAT transformer to return data that will fail validation
      const vatTransformer = require('../vatTransformer').VatTransformer;
      vatTransformer.mockImplementationOnce(() => ({
        transform: jest.fn().mockReturnValue({
          data: { 
            periodKey: 'INVALID', // This will trigger validation error
            vatDueSales: 1000,
            vatDueAcquisitions: 0,
            totalVatDue: 1000,
            vatReclaimedCurrPeriod: 500,
            netVatDue: 500,
            totalValueSalesExVAT: 5000,
            totalValuePurchasesExVAT: 2500,
            totalValueGoodsSuppliedExVAT: 0,
            totalAcquisitionsExVAT: 0,
            finalised: true
          },
          valid: true,
          errors: []
        })
      }));
      
      // Create a new service instance with the mocked transformer
      const service = new HmrcDataTransformationService();
      
      const result = service.transform(
        mockFinancialData, 
        FinancialDataType.VAT
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'periodKey',
          code: 'INVALID_PERIOD_KEY'
        })
      );
      expect(result.metadata).toMatchObject({
        errorId: 'mock-validation-id',
        recoveryActions: ['correct_data']
      });
      
      // Verify validation error was created and logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createErrorFromValidationResult).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
    });
    
    it('should handle transformer errors with proper error handling', () => {
      // Simulate an error in the transformer
      const dataWithError = {
        ...mockFinancialData,
        metadata: { simulateError: true }
      };
      
      const result = transformationService.transform(
        dataWithError, 
        FinancialDataType.VAT
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.metadata).toMatchObject({
        errorId: 'mock-request-id',
        recoveryActions: expect.any(Array)
      });
      
      // Verify error was created and logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createTransformationError).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
    });
  });
  
  describe('transformPropertyIncome', () => {
    it('should transform property income data successfully', () => {
      const result = transformationService.transform(
        mockFinancialData, 
        FinancialDataType.RENTAL_INCOME
      );
      
      expect(result.valid).toBe(true);
      expect(result.data).toMatchObject({
        fromDate: '2023-04-06',
        toDate: '2024-04-05',
        ukProperties: {
          totalIncome: 12000,
          netProfit: 7000
        }
      });
    });
    
    it('should handle validation errors with proper error handling', () => {
      // Mock the property income transformer to return data that will fail validation
      const propertyTransformer = require('../propertyIncomeTransformer').PropertyIncomeTransformer;
      propertyTransformer.mockImplementationOnce(() => ({
        transform: jest.fn().mockReturnValue({
          data: {
            fromDate: 'INVALID', // This will trigger validation error
            toDate: '2024-04-05',
            ukProperties: {
              totalIncome: 12000,
              totalExpenses: 5000,
              netProfit: 7000,
              netLoss: 0,
              properties: []
            }
          },
          valid: true,
          errors: []
        })
      }));
      
      // Create a new service instance with the mocked transformer
      const service = new HmrcDataTransformationService();
      
      const result = service.transform(
        mockFinancialData, 
        FinancialDataType.RENTAL_INCOME
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'fromDate',
          code: 'INVALID_DATE_FORMAT'
        })
      );
      
      // Verify validation error was created and logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createErrorFromValidationResult).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
    });
  });
  
  describe('transformSelfAssessment', () => {
    it('should transform self assessment data successfully', () => {
      const result = transformationService.transform(
        mockFinancialData, 
        FinancialDataType.SELF_ASSESSMENT
      );
      
      expect(result.valid).toBe(true);
      expect(result.data).toMatchObject({
        taxYear: '2023-24',
        income: {
          employment: []
        }
      });
    });
    
    it('should handle validation errors with proper error handling', () => {
      // Mock the self assessment transformer to return data that will fail validation
      const selfAssessmentTransformer = require('../selfAssessmentTransformer').SelfAssessmentTransformer;
      selfAssessmentTransformer.mockImplementationOnce(() => ({
        transform: jest.fn().mockReturnValue({
          data: {
            taxYear: 'INVALID', // This will trigger validation error
            income: {
              employment: []
            }
          },
          valid: true,
          errors: []
        })
      }));
      
      // Create a new service instance with the mocked transformer
      const service = new HmrcDataTransformationService();
      
      const result = service.transform(
        mockFinancialData, 
        FinancialDataType.SELF_ASSESSMENT
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'taxYear',
          code: 'INVALID_TAX_YEAR'
        })
      );
      
      // Verify validation error was created and logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createErrorFromValidationResult).toHaveBeenCalled();
      expect(errorHandler.logError).toHaveBeenCalled();
    });
  });
  
  describe('Error logging options', () => {
    it('should respect the logErrors option when set to false', () => {
      // Create a service with error logging disabled
      const serviceWithoutLogging = new HmrcDataTransformationService({
        logErrors: false
      });
      
      // Simulate an error in the transformer
      const dataWithError = {
        ...mockFinancialData,
        metadata: { simulateError: true }
      };
      
      serviceWithoutLogging.transform(
        dataWithError, 
        FinancialDataType.VAT
      );
      
      // Verify error was created but not logged
      const errorHandler = HmrcTransformationErrorHandler.getInstance();
      expect(errorHandler.createTransformationError).toHaveBeenCalled();
      expect(errorHandler.logError).not.toHaveBeenCalled();
    });
  });
});
