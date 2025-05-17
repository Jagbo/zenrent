/**
 * HMRC Transformation Error Handler
 * 
 * This service provides comprehensive error handling for transformation failures.
 * It captures, logs, and reports transformation errors with user-friendly messages,
 * detailed logging for debugging, and recovery procedures.
 */

import { supabase } from '@/lib/supabase';
import { 
  TransformationError, 
  TransformationErrorType,
  TransformationErrorCategory,
  RecoveryAction,
  ValidationResult,
  FinancialDataType
} from './types';

/**
 * User-friendly error messages mapped to transformation error types
 */
const userFriendlyMessages: Record<TransformationErrorType, string> = {
  [TransformationErrorType.INVALID_DATA]: 'The financial data provided is invalid or incomplete. Please review and correct the data.',
  [TransformationErrorType.MISSING_REQUIRED_FIELD]: 'Required information is missing from your financial data. Please provide all required fields.',
  [TransformationErrorType.CALCULATION_ERROR]: 'There was an error in the tax calculations. Please check your financial figures.',
  [TransformationErrorType.DATE_FORMAT_ERROR]: 'One or more dates are in an incorrect format. Please use the YYYY-MM-DD format.',
  [TransformationErrorType.INVALID_PERIOD]: 'The reporting period is invalid. Please check the start and end dates.',
  [TransformationErrorType.NEGATIVE_VALUE]: 'Negative values were found where positive values are required. Please review your financial data.',
  [TransformationErrorType.THRESHOLD_EXCEEDED]: 'One or more values exceed the allowed thresholds for HMRC submissions.',
  [TransformationErrorType.VALIDATION_ERROR]: 'The transformed data failed validation checks. Please review the specific validation errors.',
  [TransformationErrorType.TRANSFORMATION_FAILED]: 'The transformation process failed. Please try again or contact support.',
  [TransformationErrorType.UNSUPPORTED_TYPE]: 'The requested transformation type is not supported.',
  [TransformationErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred during transformation. Please try again or contact support.'
};

/**
 * Recovery actions that can be taken for different error types
 */
const recoveryActionMap: Record<TransformationErrorType, RecoveryAction[]> = {
  [TransformationErrorType.INVALID_DATA]: [RecoveryAction.CORRECT_DATA, RecoveryAction.CONTACT_SUPPORT],
  [TransformationErrorType.MISSING_REQUIRED_FIELD]: [RecoveryAction.PROVIDE_MISSING_DATA],
  [TransformationErrorType.CALCULATION_ERROR]: [RecoveryAction.RECALCULATE, RecoveryAction.MANUAL_ENTRY],
  [TransformationErrorType.DATE_FORMAT_ERROR]: [RecoveryAction.CORRECT_FORMAT],
  [TransformationErrorType.INVALID_PERIOD]: [RecoveryAction.CORRECT_PERIOD],
  [TransformationErrorType.NEGATIVE_VALUE]: [RecoveryAction.CORRECT_DATA],
  [TransformationErrorType.THRESHOLD_EXCEEDED]: [RecoveryAction.REVIEW_THRESHOLDS, RecoveryAction.CONTACT_SUPPORT],
  [TransformationErrorType.VALIDATION_ERROR]: [RecoveryAction.CORRECT_DATA, RecoveryAction.CONTACT_SUPPORT],
  [TransformationErrorType.TRANSFORMATION_FAILED]: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT],
  [TransformationErrorType.UNSUPPORTED_TYPE]: [RecoveryAction.CONTACT_SUPPORT],
  [TransformationErrorType.UNKNOWN_ERROR]: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT]
};

/**
 * Mapping of transformation error types to error categories
 */
const errorCategoryMap: Record<TransformationErrorType, TransformationErrorCategory> = {
  [TransformationErrorType.INVALID_DATA]: TransformationErrorCategory.DATA_ERROR,
  [TransformationErrorType.MISSING_REQUIRED_FIELD]: TransformationErrorCategory.DATA_ERROR,
  [TransformationErrorType.CALCULATION_ERROR]: TransformationErrorCategory.CALCULATION_ERROR,
  [TransformationErrorType.DATE_FORMAT_ERROR]: TransformationErrorCategory.FORMAT_ERROR,
  [TransformationErrorType.INVALID_PERIOD]: TransformationErrorCategory.FORMAT_ERROR,
  [TransformationErrorType.NEGATIVE_VALUE]: TransformationErrorCategory.DATA_ERROR,
  [TransformationErrorType.THRESHOLD_EXCEEDED]: TransformationErrorCategory.THRESHOLD_ERROR,
  [TransformationErrorType.VALIDATION_ERROR]: TransformationErrorCategory.VALIDATION_ERROR,
  [TransformationErrorType.TRANSFORMATION_FAILED]: TransformationErrorCategory.SYSTEM_ERROR,
  [TransformationErrorType.UNSUPPORTED_TYPE]: TransformationErrorCategory.SYSTEM_ERROR,
  [TransformationErrorType.UNKNOWN_ERROR]: TransformationErrorCategory.UNKNOWN_ERROR
};

/**
 * HMRC Transformation Error Handler
 */
export class HmrcTransformationErrorHandler {
  private static instance: HmrcTransformationErrorHandler;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of the error handler
   */
  public static getInstance(): HmrcTransformationErrorHandler {
    if (!HmrcTransformationErrorHandler.instance) {
      HmrcTransformationErrorHandler.instance = new HmrcTransformationErrorHandler();
    }
    return HmrcTransformationErrorHandler.instance;
  }
  
  /**
   * Create a structured transformation error from various error types
   * 
   * @param error The error object or string
   * @param userId Optional user ID for tracking
   * @param transformationType Type of transformation being performed
   * @param additionalDetails Additional error details
   * @returns Structured transformation error
   */
  public createTransformationError(
    error: any,
    transformationType: FinancialDataType,
    userId?: string,
    additionalDetails?: Record<string, any>
  ): TransformationError {
    // Determine error type
    const errorType = this.determineErrorType(error);
    
    // Get user-friendly message
    const userMessage = userFriendlyMessages[errorType];
    
    // Get error category
    const category = errorCategoryMap[errorType];
    
    // Get recovery actions
    const recoveryActions = recoveryActionMap[errorType];
    
    // Generate request ID for tracking
    const requestId = this.generateRequestId();
    
    // Extract technical message
    const technicalMessage = error instanceof Error ? error.message : String(error);
    
    // Create structured error
    return {
      type: errorType,
      message: technicalMessage,
      userMessage,
      category,
      recoveryActions,
      timestamp: new Date(),
      details: {
        transformationType,
        ...additionalDetails
      },
      userId,
      requestId
    };
  }
  
  /**
   * Determine the error type from the error object
   * 
   * @param error The error object
   * @returns The determined error type
   */
  private determineErrorType(error: any): TransformationErrorType {
    if (!error) {
      return TransformationErrorType.UNKNOWN_ERROR;
    }
    
    // Check if it's a validation result
    if (error.valid === false && Array.isArray(error.errors)) {
      return TransformationErrorType.VALIDATION_ERROR;
    }
    
    // Check if it's already a TransformationError
    if (error.type && Object.values(TransformationErrorType).includes(error.type)) {
      return error.type;
    }
    
    // Check error message for clues
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('required field') || errorMsg.includes('missing')) {
      return TransformationErrorType.MISSING_REQUIRED_FIELD;
    }
    
    if (errorMsg.includes('calculation') || errorMsg.includes('math')) {
      return TransformationErrorType.CALCULATION_ERROR;
    }
    
    if (errorMsg.includes('date format') || errorMsg.includes('invalid date')) {
      return TransformationErrorType.DATE_FORMAT_ERROR;
    }
    
    if (errorMsg.includes('period') || errorMsg.includes('date range')) {
      return TransformationErrorType.INVALID_PERIOD;
    }
    
    if (errorMsg.includes('negative') || errorMsg.includes('less than zero')) {
      return TransformationErrorType.NEGATIVE_VALUE;
    }
    
    if (errorMsg.includes('threshold') || errorMsg.includes('limit exceeded')) {
      return TransformationErrorType.THRESHOLD_EXCEEDED;
    }
    
    if (errorMsg.includes('transformation failed') || errorMsg.includes('transform error')) {
      return TransformationErrorType.TRANSFORMATION_FAILED;
    }
    
    if (errorMsg.includes('unsupported type') || errorMsg.includes('not supported')) {
      return TransformationErrorType.UNSUPPORTED_TYPE;
    }
    
    if (errorMsg.includes('invalid data') || errorMsg.includes('invalid input')) {
      return TransformationErrorType.INVALID_DATA;
    }
    
    return TransformationErrorType.UNKNOWN_ERROR;
  }
  
  /**
   * Log a transformation error to the database and console
   * 
   * @param error The structured transformation error
   * @returns The request ID for tracking
   */
  public async logError(error: TransformationError): Promise<string> {
    try {
      // Log to console
      console.error('Transformation Error:', {
        type: error.type,
        message: error.message,
        category: error.category,
        timestamp: error.timestamp,
        requestId: error.requestId,
        userId: error.userId,
        transformationType: error.details?.transformationType
      });
      
      // Log to database
      const { data, error: dbError } = await supabase
        .from('transformation_errors')
        .insert({
          user_id: error.userId || null,
          error_type: error.type,
          error_category: error.category,
          message: error.message,
          user_message: error.userMessage,
          details: error.details,
          request_id: error.requestId,
          timestamp: error.timestamp.toISOString()
        });
      
      if (dbError) {
        console.error('Failed to log transformation error to database:', dbError);
      }
      
      return error.requestId;
    } catch (logError) {
      console.error('Error logging transformation error:', logError);
      return error.requestId;
    }
  }
  
  /**
   * Generate a unique request ID for error tracking
   */
  public generateRequestId(): string {
    return `transform-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Create a user-friendly error response
   * 
   * @param error The structured transformation error
   * @returns User-friendly error response
   */
  public createErrorResponse(error: TransformationError): {
    status: 'error';
    message: string;
    code: string;
    requestId: string;
    recoveryAction?: RecoveryAction;
    details?: Record<string, any>;
  } {
    // Select the most appropriate recovery action
    const primaryRecoveryAction = error.recoveryActions.length > 0
      ? error.recoveryActions[0]
      : RecoveryAction.CONTACT_SUPPORT;
    
    return {
      status: 'error',
      message: error.userMessage,
      code: error.type,
      requestId: error.requestId,
      recoveryAction: primaryRecoveryAction,
      details: error.details
    };
  }
  
  /**
   * Convert validation result to transformation error
   * 
   * @param validationResult The validation result
   * @param transformationType Type of transformation being performed
   * @param userId Optional user ID for tracking
   * @returns Structured transformation error
   */
  public createErrorFromValidationResult(
    validationResult: ValidationResult,
    transformationType: FinancialDataType,
    userId?: string
  ): TransformationError {
    const errorDetails = {
      validationErrors: validationResult.errors,
      validationWarnings: validationResult.warnings || [],
      transformationType
    };
    
    return {
      type: TransformationErrorType.VALIDATION_ERROR,
      message: `Validation failed with ${validationResult.errors.length} errors`,
      userMessage: userFriendlyMessages[TransformationErrorType.VALIDATION_ERROR],
      category: TransformationErrorCategory.VALIDATION_ERROR,
      recoveryActions: recoveryActionMap[TransformationErrorType.VALIDATION_ERROR],
      timestamp: new Date(),
      details: errorDetails,
      userId,
      requestId: this.generateRequestId()
    };
  }
  
  /**
   * Get a user-friendly error message for a given error type
   * 
   * @param errorType The transformation error type
   * @returns User-friendly error message
   */
  public getUserFriendlyMessage(errorType: TransformationErrorType): string {
    return userFriendlyMessages[errorType] || userFriendlyMessages[TransformationErrorType.UNKNOWN_ERROR];
  }
  
  /**
   * Check if an error is a duplicate of a previously reported error
   * 
   * @param error The error to check
   * @param userId The user ID
   * @param timeWindowMinutes Time window in minutes to check for duplicates
   * @returns Whether the error is a duplicate
   */
  public async isDuplicateError(
    error: TransformationError,
    userId: string,
    timeWindowMinutes: number = 30
  ): Promise<boolean> {
    try {
      // Calculate time window
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
      
      // Check for similar errors in the database
      const { data, error: dbError } = await supabase
        .from('transformation_errors')
        .select('*')
        .eq('user_id', userId)
        .eq('error_type', error.type)
        .gte('timestamp', timeWindow.toISOString())
        .limit(1);
      
      if (dbError) {
        console.error('Error checking for duplicate errors:', dbError);
        return false;
      }
      
      return data && data.length > 0;
    } catch (checkError) {
      console.error('Error checking for duplicate errors:', checkError);
      return false;
    }
  }
  
  /**
   * Suggest recovery procedures for a transformation error
   * 
   * @param error The transformation error
   * @returns Array of recovery steps with descriptions
   */
  public suggestRecoveryProcedures(error: TransformationError): Array<{
    action: RecoveryAction;
    description: string;
  }> {
    const recoverySteps: Array<{ action: RecoveryAction; description: string }> = [];
    
    for (const action of error.recoveryActions) {
      let description = '';
      
      switch (action) {
        case RecoveryAction.CORRECT_DATA:
          description = 'Review and correct the financial data that failed validation.';
          break;
        case RecoveryAction.PROVIDE_MISSING_DATA:
          description = 'Add the missing required information to your financial data.';
          break;
        case RecoveryAction.RECALCULATE:
          description = 'Recalculate the financial figures to ensure they are accurate.';
          break;
        case RecoveryAction.MANUAL_ENTRY:
          description = 'Manually enter the correct values instead of using automatic calculation.';
          break;
        case RecoveryAction.CORRECT_FORMAT:
          description = 'Fix the format of the data, especially dates (use YYYY-MM-DD).';
          break;
        case RecoveryAction.CORRECT_PERIOD:
          description = 'Ensure the reporting period dates are valid and in the correct order.';
          break;
        case RecoveryAction.REVIEW_THRESHOLDS:
          description = 'Check if any values exceed HMRC thresholds and adjust if necessary.';
          break;
        case RecoveryAction.RETRY:
          description = 'Try the transformation again after making corrections.';
          break;
        case RecoveryAction.CONTACT_SUPPORT:
          description = 'Contact support for assistance with this error.';
          break;
        default:
          description = 'Take appropriate action based on the error details.';
      }
      
      recoverySteps.push({ action, description });
    }
    
    return recoverySteps;
  }
}
