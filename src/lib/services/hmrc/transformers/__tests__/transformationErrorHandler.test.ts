/**
 * Tests for HMRC Transformation Error Handler
 */

import { 
  FinancialDataType,
  TransformationErrorType,
  TransformationErrorCategory,
  RecoveryAction,
  ValidationResult
} from '../types';
import { HmrcTransformationErrorHandler } from '../transformationErrorHandler';

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

describe('HmrcTransformationErrorHandler', () => {
  let errorHandler: HmrcTransformationErrorHandler;
  
  beforeEach(() => {
    errorHandler = HmrcTransformationErrorHandler.getInstance();
    jest.clearAllMocks();
  });
  
  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = HmrcTransformationErrorHandler.getInstance();
      const instance2 = HmrcTransformationErrorHandler.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('createTransformationError', () => {
    it('should create a structured error from an Error object', () => {
      const error = new Error('Test error message');
      const transformationType = FinancialDataType.VAT;
      const userId = 'user-123';
      
      const result = errorHandler.createTransformationError(error, transformationType, userId);
      
      expect(result).toMatchObject({
        message: 'Test error message',
        type: expect.any(String),
        userMessage: expect.any(String),
        category: expect.any(String),
        recoveryActions: expect.any(Array),
        timestamp: expect.any(Date),
        userId: 'user-123',
        requestId: expect.any(String),
        details: {
          transformationType: FinancialDataType.VAT
        }
      });
    });
    
    it('should create a structured error from a string', () => {
      const error = 'String error message';
      const transformationType = FinancialDataType.RENTAL_INCOME;
      
      const result = errorHandler.createTransformationError(error, transformationType);
      
      expect(result).toMatchObject({
        message: 'String error message',
        type: expect.any(String),
        userMessage: expect.any(String),
        category: expect.any(String),
        recoveryActions: expect.any(Array),
        timestamp: expect.any(Date),
        requestId: expect.any(String),
        details: {
          transformationType: FinancialDataType.RENTAL_INCOME
        }
      });
    });
    
    it('should include additional details when provided', () => {
      const error = new Error('Test error with details');
      const transformationType = FinancialDataType.SELF_ASSESSMENT;
      const userId = 'user-456';
      const additionalDetails = { 
        customField: 'custom value',
        testObject: { nestedField: 123 }
      };
      
      const result = errorHandler.createTransformationError(
        error, 
        transformationType, 
        userId, 
        additionalDetails
      );
      
      expect(result.details).toMatchObject({
        transformationType: FinancialDataType.SELF_ASSESSMENT,
        customField: 'custom value',
        testObject: { nestedField: 123 }
      });
    });
    
    it('should determine the appropriate error type based on the error message', () => {
      const testCases = [
        { message: 'missing required field', expectedType: TransformationErrorType.MISSING_REQUIRED_FIELD },
        { message: 'calculation error', expectedType: TransformationErrorType.CALCULATION_ERROR },
        { message: 'invalid date format', expectedType: TransformationErrorType.DATE_FORMAT_ERROR },
        { message: 'invalid period', expectedType: TransformationErrorType.INVALID_PERIOD },
        { message: 'negative value not allowed', expectedType: TransformationErrorType.NEGATIVE_VALUE },
        { message: 'threshold exceeded', expectedType: TransformationErrorType.THRESHOLD_EXCEEDED },
        { message: 'transformation failed', expectedType: TransformationErrorType.TRANSFORMATION_FAILED },
        { message: 'unsupported type', expectedType: TransformationErrorType.UNSUPPORTED_TYPE },
        { message: 'invalid data', expectedType: TransformationErrorType.INVALID_DATA },
        { message: 'unknown error type', expectedType: TransformationErrorType.UNKNOWN_ERROR }
      ];
      
      testCases.forEach(({ message, expectedType }) => {
        const error = new Error(message);
        const result = errorHandler.createTransformationError(error, FinancialDataType.VAT);
        expect(result.type).toBe(expectedType);
      });
    });
  });
  
  describe('createErrorFromValidationResult', () => {
    it('should create a structured error from a validation result', () => {
      const validationResult: ValidationResult = {
        valid: false,
        errors: [
          { field: 'test', message: 'Test validation error', code: 'TEST_ERROR' },
          { field: 'another', message: 'Another error', code: 'ANOTHER_ERROR' }
        ]
      };
      
      const result = errorHandler.createErrorFromValidationResult(
        validationResult,
        FinancialDataType.VAT,
        'user-789'
      );
      
      expect(result).toMatchObject({
        type: TransformationErrorType.VALIDATION_ERROR,
        message: 'Validation failed with 2 errors',
        userMessage: expect.stringContaining('validation'),
        category: TransformationErrorCategory.VALIDATION_ERROR,
        recoveryActions: expect.arrayContaining([RecoveryAction.CORRECT_DATA]),
        timestamp: expect.any(Date),
        userId: 'user-789',
        requestId: expect.any(String),
        details: {
          validationErrors: validationResult.errors,
          validationWarnings: [],
          transformationType: FinancialDataType.VAT
        }
      });
    });
    
    it('should include warnings when present in the validation result', () => {
      const validationResult: ValidationResult = {
        valid: false,
        errors: [
          { field: 'test', message: 'Test validation error', code: 'TEST_ERROR' }
        ],
        warnings: [
          { field: 'warning', message: 'Test warning', code: 'WARNING_CODE' }
        ]
      };
      
      const result = errorHandler.createErrorFromValidationResult(
        validationResult,
        FinancialDataType.SELF_ASSESSMENT
      );
      
      expect(result.details).toMatchObject({
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings,
        transformationType: FinancialDataType.SELF_ASSESSMENT
      });
    });
  });
  
  describe('logError', () => {
    it('should log the error to the database', async () => {
      const error = errorHandler.createTransformationError(
        new Error('Test error for logging'),
        FinancialDataType.VAT,
        'user-abc'
      );
      
      const requestId = await errorHandler.logError(error);
      
      expect(requestId).toBe(error.requestId);
      
      // Verify that supabase.from().insert() was called with the correct data
      const supabase = require('@/lib/supabase').supabase;
      expect(supabase.from).toHaveBeenCalledWith('transformation_errors');
      expect(supabase.insert).toHaveBeenCalledWith({
        user_id: 'user-abc',
        error_type: error.type,
        error_category: error.category,
        message: error.message,
        user_message: error.userMessage,
        details: error.details,
        request_id: error.requestId,
        timestamp: error.timestamp.toISOString()
      });
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const supabase = require('@/lib/supabase').supabase;
      supabase.insert.mockReturnValueOnce({ 
        data: null, 
        error: new Error('Database error') 
      });
      
      const error = errorHandler.createTransformationError(
        new Error('Test error with DB failure'),
        FinancialDataType.VAT
      );
      
      const requestId = await errorHandler.logError(error);
      
      // Should still return the request ID even if DB logging fails
      expect(requestId).toBe(error.requestId);
    });
  });
  
  describe('isDuplicateError', () => {
    it('should check for duplicate errors in the database', async () => {
      const error = errorHandler.createTransformationError(
        new Error('Test duplicate error'),
        FinancialDataType.VAT,
        'user-dup'
      );
      
      // Mock finding a duplicate
      const supabase = require('@/lib/supabase').supabase;
      supabase.select.mockReturnValueOnce({
        data: [{ id: 'existing-error' }],
        error: null
      });
      
      const isDuplicate = await errorHandler.isDuplicateError(error, 'user-dup', 30);
      
      expect(isDuplicate).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('transformation_errors');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user-dup');
      expect(supabase.eq).toHaveBeenCalledWith('error_type', error.type);
    });
    
    it('should return false when no duplicates are found', async () => {
      const error = errorHandler.createTransformationError(
        new Error('Test non-duplicate error'),
        FinancialDataType.VAT,
        'user-nondup'
      );
      
      // Mock finding no duplicates
      const supabase = require('@/lib/supabase').supabase;
      supabase.limit.mockReturnValueOnce({
        data: [],
        error: null
      });
      
      const isDuplicate = await errorHandler.isDuplicateError(error, 'user-nondup');
      
      expect(isDuplicate).toBe(false);
    });
  });
  
  describe('suggestRecoveryProcedures', () => {
    it('should provide recovery procedures for each recovery action', () => {
      const error = errorHandler.createTransformationError(
        new Error('Test error for recovery'),
        FinancialDataType.VAT
      );
      
      const procedures = errorHandler.suggestRecoveryProcedures(error);
      
      expect(procedures.length).toBe(error.recoveryActions.length);
      procedures.forEach(procedure => {
        expect(procedure).toMatchObject({
          action: expect.any(String),
          description: expect.any(String)
        });
        expect(procedure.description.length).toBeGreaterThan(0);
      });
    });
    
    it('should provide specific descriptions for each recovery action type', () => {
      const error = {
        type: TransformationErrorType.MISSING_REQUIRED_FIELD,
        message: 'Test message',
        userMessage: 'User message',
        category: TransformationErrorCategory.DATA_ERROR,
        recoveryActions: [
          RecoveryAction.PROVIDE_MISSING_DATA,
          RecoveryAction.CORRECT_DATA,
          RecoveryAction.CONTACT_SUPPORT
        ],
        timestamp: new Date(),
        requestId: 'test-id'
      };
      
      const procedures = errorHandler.suggestRecoveryProcedures(error);
      
      expect(procedures[0].action).toBe(RecoveryAction.PROVIDE_MISSING_DATA);
      expect(procedures[0].description).toContain('missing');
      
      expect(procedures[1].action).toBe(RecoveryAction.CORRECT_DATA);
      expect(procedures[1].description).toContain('correct');
      
      expect(procedures[2].action).toBe(RecoveryAction.CONTACT_SUPPORT);
      expect(procedures[2].description).toContain('support');
    });
  });
  
  describe('createErrorResponse', () => {
    it('should create a user-friendly error response', () => {
      const error = errorHandler.createTransformationError(
        new Error('Technical error message'),
        FinancialDataType.VAT,
        'user-xyz'
      );
      
      const response = errorHandler.createErrorResponse(error);
      
      expect(response).toMatchObject({
        status: 'error',
        message: error.userMessage,
        code: error.type,
        requestId: error.requestId,
        recoveryAction: error.recoveryActions[0],
        details: error.details
      });
    });
  });
  
  describe('getUserFriendlyMessage', () => {
    it('should return the user-friendly message for a given error type', () => {
      const message = errorHandler.getUserFriendlyMessage(TransformationErrorType.CALCULATION_ERROR);
      
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain('calculation');
    });
    
    it('should return the unknown error message for unrecognized error types', () => {
      // @ts-ignore - Testing with invalid input
      const message = errorHandler.getUserFriendlyMessage('NOT_A_REAL_ERROR_TYPE');
      
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain('unexpected');
    });
  });
  
  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = errorHandler.generateRequestId();
      const id2 = errorHandler.generateRequestId();
      
      expect(id1).toMatch(/^transform-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^transform-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
