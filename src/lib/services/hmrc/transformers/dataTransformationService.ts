/**
 * HMRC Data Transformation Service
 * 
 * This service transforms ZenRent financial data into HMRC-compliant formats
 * for Making Tax Digital (MTD) submissions. It provides a unified interface
 * for all transformation operations.
 */

import {
  FinancialData,
  FinancialDataType,
  TransformationOptions,
  TransformationResult,
  VatReturnPayload,
  PropertyIncomePayload,
  SelfAssessmentPayload,
  TransformationErrorType,
  TransformationError
} from './types';
import { VatTransformer } from './vatTransformer';
import { PropertyIncomeTransformer } from './propertyIncomeTransformer';
import { SelfAssessmentTransformer } from './selfAssessmentTransformer';
import { HmrcValidationService } from '../validators/validationService';
import { HmrcTransformationErrorHandler } from './transformationErrorHandler';

/**
 * HMRC Data Transformation Service
 */
export class HmrcDataTransformationService {
  private vatTransformer: VatTransformer;
  private propertyIncomeTransformer: PropertyIncomeTransformer;
  private selfAssessmentTransformer: SelfAssessmentTransformer;
  private validationService: HmrcValidationService;
  private errorHandler: HmrcTransformationErrorHandler;
  private options: TransformationOptions;
  private userId?: string;

  /**
   * Constructor
   * 
   * @param options Transformation options
   */
  constructor(options: TransformationOptions = {}) {
    this.options = {
      roundingPrecision: 2,
      validateOutput: true,
      includeNonMandatoryFields: true,
      currencyCode: 'GBP',
      debug: false,
      logErrors: true,
      ...options
    };
    
    // Extract userId from options if provided
    this.userId = options.userId;

    // Initialize transformers
    this.vatTransformer = new VatTransformer(this.options);
    this.propertyIncomeTransformer = new PropertyIncomeTransformer(this.options);
    this.selfAssessmentTransformer = new SelfAssessmentTransformer(this.options);
    
    // Initialize validation service
    this.validationService = new HmrcValidationService();
    
    // Initialize error handler
    this.errorHandler = HmrcTransformationErrorHandler.getInstance();
  }

  /**
   * Transform financial data to HMRC format
   * 
   * @param data Financial data to transform
   * @param type Type of transformation to perform
   * @param options Transformation options (overrides constructor options)
   * @returns Transformation result
   */
  public transform<T extends VatReturnPayload | PropertyIncomePayload | SelfAssessmentPayload>(
    data: FinancialData,
    type: FinancialDataType,
    options?: TransformationOptions
  ): TransformationResult<T> {
    const mergedOptions = { ...this.options, ...options };
    const userId = mergedOptions.userId || this.userId || data.userId;
    
    try {
      switch (type) {
        case FinancialDataType.VAT:
          return this.transformVat(data, mergedOptions) as TransformationResult<T>;
        case FinancialDataType.RENTAL_INCOME:
          return this.transformPropertyIncome(data, mergedOptions) as TransformationResult<T>;
        case FinancialDataType.SELF_ASSESSMENT:
          return this.transformSelfAssessment(data, mergedOptions) as TransformationResult<T>;
        default:
          // Create and handle unsupported type error
          const unsupportedError = this.errorHandler.createTransformationError(
            { message: `Unsupported transformation type: ${type}` },
            type,
            userId,
            { attemptedType: type }
          );
          
          // Log the error if logging is enabled
          if (mergedOptions.logErrors !== false) {
            this.errorHandler.logError(unsupportedError).catch(err => {
              console.error('Failed to log transformation error:', err);
            });
          }
          
          // Return error result
          return {
            data: {} as T,
            valid: false,
            errors: [{
              field: 'type',
              message: unsupportedError.userMessage,
              code: unsupportedError.type
            }],
            metadata: {
              errorId: unsupportedError.requestId,
              recoveryActions: unsupportedError.recoveryActions
            }
          };
      }
    } catch (error) {
      // Create and handle transformation error
      const transformError = this.errorHandler.createTransformationError(
        error,
        type,
        userId,
        { dataSnapshot: this.options.debug ? data : undefined }
      );
      
      // Log the error if logging is enabled
      if (mergedOptions.logErrors !== false) {
        this.errorHandler.logError(transformError).catch(err => {
          console.error('Failed to log transformation error:', err);
        });
      }
      
      // Get recovery procedures
      const recoveryProcedures = this.errorHandler.suggestRecoveryProcedures(transformError);
      
      // Return error result with recovery information
      return {
        data: {} as T,
        valid: false,
        errors: [{
          field: 'general',
          message: transformError.userMessage,
          code: transformError.type
        }],
        metadata: {
          errorId: transformError.requestId,
          recoveryActions: transformError.recoveryActions,
          recoveryProcedures: recoveryProcedures.map(p => ({ action: p.action, description: p.description }))
        }
      };
    }
  }

  /**
   * Transform financial data to VAT return format
   * 
   * @param data Financial data to transform
   * @param options Transformation options
   * @returns VAT return transformation result
   */
  private transformVat(
    data: FinancialData,
    options: TransformationOptions
  ): TransformationResult<VatReturnPayload> {
    const userId = options.userId || this.userId || data.userId;
    
    try {
      // Transform data
      const result = this.vatTransformer.transform(data);
      
      // If transformation was successful, validate the result
      if (result.valid && options.validateOutput !== false) {
        const validationResult = this.validationService.validateVatReturn(result.data, data);
        
        // Combine validation errors and warnings with transformation result
        if (!validationResult.valid) {
          // Create validation error
          const validationError = this.errorHandler.createErrorFromValidationResult(
            validationResult,
            FinancialDataType.VAT,
            userId
          );
          
          // Log the validation error if logging is enabled
          if (options.logErrors !== false) {
            this.errorHandler.logError(validationError).catch(err => {
              console.error('Failed to log validation error:', err);
            });
          }
          
          // Update result with validation error details
          result.valid = false;
          result.errors = [...result.errors, ...validationResult.errors];
          result.metadata = {
            ...result.metadata,
            errorId: validationError.requestId,
            recoveryActions: validationError.recoveryActions
          };
        }
        
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          result.warnings = [...(result.warnings || []), ...validationResult.warnings];
        }
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors during transformation
      const transformError = this.errorHandler.createTransformationError(
        error,
        FinancialDataType.VAT,
        userId,
        { dataSnapshot: options.debug ? data : undefined }
      );
      
      // Log the error if logging is enabled
      if (options.logErrors !== false) {
        this.errorHandler.logError(transformError).catch(err => {
          console.error('Failed to log transformation error:', err);
        });
      }
      
      // Return error result
      return {
        data: {} as VatReturnPayload,
        valid: false,
        errors: [{
          field: 'general',
          message: transformError.userMessage,
          code: transformError.type
        }],
        metadata: {
          errorId: transformError.requestId,
          recoveryActions: transformError.recoveryActions
        }
      };
    }
  }

  /**
   * Transform financial data to property income format
   * 
   * @param data Financial data to transform
   * @param options Transformation options
   * @returns Property income transformation result
   */
  private transformPropertyIncome(
    data: FinancialData,
    options: TransformationOptions
  ): TransformationResult<PropertyIncomePayload> {
    const userId = options.userId || this.userId || data.userId;
    
    try {
      // Transform data
      const result = this.propertyIncomeTransformer.transform(data);
      
      // If transformation was successful, validate the result
      if (result.valid && options.validateOutput !== false) {
        const validationResult = this.validationService.validatePropertyIncome(result.data, data);
        
        // Combine validation errors and warnings with transformation result
        if (!validationResult.valid) {
          // Create validation error
          const validationError = this.errorHandler.createErrorFromValidationResult(
            validationResult,
            FinancialDataType.RENTAL_INCOME,
            userId
          );
          
          // Log the validation error if logging is enabled
          if (options.logErrors !== false) {
            this.errorHandler.logError(validationError).catch(err => {
              console.error('Failed to log validation error:', err);
            });
          }
          
          // Update result with validation error details
          result.valid = false;
          result.errors = [...result.errors, ...validationResult.errors];
          result.metadata = {
            ...result.metadata,
            errorId: validationError.requestId,
            recoveryActions: validationError.recoveryActions
          };
        }
        
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          result.warnings = [...(result.warnings || []), ...validationResult.warnings];
        }
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors during transformation
      const transformError = this.errorHandler.createTransformationError(
        error,
        FinancialDataType.RENTAL_INCOME,
        userId,
        { dataSnapshot: options.debug ? data : undefined }
      );
      
      // Log the error if logging is enabled
      if (options.logErrors !== false) {
        this.errorHandler.logError(transformError).catch(err => {
          console.error('Failed to log transformation error:', err);
        });
      }
      
      // Return error result
      return {
        data: {} as PropertyIncomePayload,
        valid: false,
        errors: [{
          field: 'general',
          message: transformError.userMessage,
          code: transformError.type
        }],
        metadata: {
          errorId: transformError.requestId,
          recoveryActions: transformError.recoveryActions
        }
      };
    }
  }

  /**
   * Transform financial data to self assessment format
   * 
   * @param data Financial data to transform
   * @param options Transformation options
   * @returns Self assessment transformation result
   */
  private transformSelfAssessment(
    data: FinancialData,
    options: TransformationOptions
  ): TransformationResult<SelfAssessmentPayload> {
    const userId = options.userId || this.userId || data.userId;
    
    try {
      // Transform data
      const result = this.selfAssessmentTransformer.transform(data);
      
      // If transformation was successful, validate the result
      if (result.valid && options.validateOutput !== false) {
        const validationResult = this.validationService.validateSelfAssessment(result.data, data);
        
        // Combine validation errors and warnings with transformation result
        if (!validationResult.valid) {
          // Create validation error
          const validationError = this.errorHandler.createErrorFromValidationResult(
            validationResult,
            FinancialDataType.SELF_ASSESSMENT,
            userId
          );
          
          // Log the validation error if logging is enabled
          if (options.logErrors !== false) {
            this.errorHandler.logError(validationError).catch(err => {
              console.error('Failed to log validation error:', err);
            });
          }
          
          // Update result with validation error details
          result.valid = false;
          result.errors = [...result.errors, ...validationResult.errors];
          result.metadata = {
            ...result.metadata,
            errorId: validationError.requestId,
            recoveryActions: validationError.recoveryActions
          };
        }
        
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          result.warnings = [...(result.warnings || []), ...validationResult.warnings];
        }
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors during transformation
      const transformError = this.errorHandler.createTransformationError(
        error,
        FinancialDataType.SELF_ASSESSMENT,
        userId,
        { dataSnapshot: options.debug ? data : undefined }
      );
      
      // Log the error if logging is enabled
      if (options.logErrors !== false) {
        this.errorHandler.logError(transformError).catch(err => {
          console.error('Failed to log transformation error:', err);
        });
      }
      
      // Return error result
      return {
        data: {} as SelfAssessmentPayload,
        valid: false,
        errors: [{
          field: 'general',
          message: transformError.userMessage,
          code: transformError.type
        }],
        metadata: {
          errorId: transformError.requestId,
          recoveryActions: transformError.recoveryActions
        }
      };
    }
  }
}
