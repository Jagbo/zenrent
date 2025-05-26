import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/utils/rateLimit';
import { NextRequest } from 'next/server';

/**
 * OAuth error types according to OAuth 2.0 specification
 * Reference: https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export enum OAuthErrorType {
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',
  ACCESS_DENIED = 'access_denied',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  INSUFFICIENT_SCOPE = 'insufficient_scope',
  NETWORK_ERROR = 'network_error',    // Custom type for fetch/network failures
  TOKEN_EXPIRED = 'token_expired',     // Custom type for expired tokens
  UNKNOWN_ERROR = 'unknown_error'      // Fallback for unrecognized errors
}

/**
 * Error categories for grouping similar errors
 */
export enum ErrorCategory {
  CLIENT_ERROR = 'client_error',       // Client-side issues (invalid parameters, etc.)
  AUTHENTICATION_ERROR = 'authentication_error', // Auth issues (invalid credentials, etc.)
  AUTHORIZATION_ERROR = 'authorization_error',   // Permission issues (invalid scope, etc.)
  SERVER_ERROR = 'server_error',       // HMRC server issues
  CONFIGURATION_ERROR = 'configuration_error',   // App configuration issues
  NETWORK_ERROR = 'network_error',     // Network connectivity issues
  SECURITY_ERROR = 'security_error',   // Security-related issues (CSRF, etc.)
  UNKNOWN_ERROR = 'unknown_error'      // Fallback for unrecognized issues
}

/**
 * User-friendly error messages mapped to OAuth error types
 */
const userFriendlyMessages: Record<OAuthErrorType, string> = {
  [OAuthErrorType.INVALID_REQUEST]: 'There was a problem with the request to HMRC. Please try again or contact support.',
  [OAuthErrorType.INVALID_CLIENT]: 'The application is not properly configured for HMRC access. Please contact support.',
  [OAuthErrorType.INVALID_GRANT]: 'Your authorization to access HMRC has expired or been revoked. Please reconnect to HMRC.',
  [OAuthErrorType.UNAUTHORIZED_CLIENT]: 'This application is not authorized to access HMRC in this way. Please contact support.',
  [OAuthErrorType.UNSUPPORTED_GRANT_TYPE]: 'The connection method used is not supported by HMRC. Please contact support.',
  [OAuthErrorType.INVALID_SCOPE]: 'The requested permissions for HMRC are invalid. Please contact support.',
  [OAuthErrorType.ACCESS_DENIED]: 'Access to HMRC was denied. Please check your credentials and try again.',
  [OAuthErrorType.SERVER_ERROR]: 'HMRC service is experiencing technical difficulties. Please try again later.',
  [OAuthErrorType.TEMPORARILY_UNAVAILABLE]: 'HMRC service is temporarily unavailable. Please try again in a few minutes.',
  [OAuthErrorType.INSUFFICIENT_SCOPE]: 'Your HMRC authorization does not have the required permissions. Please reconnect to HMRC with additional permissions.',
  [OAuthErrorType.NETWORK_ERROR]: 'Network connection issue detected. Please check your internet connection and try again.',
  [OAuthErrorType.TOKEN_EXPIRED]: 'Your HMRC session has expired. Please reconnect to HMRC.',
  [OAuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred with the HMRC connection. Please try again or contact support.'
};

/**
 * Recovery actions that can be taken for different error types
 */
export enum RecoveryAction {
  RETRY = 'retry',                     // Retry the same operation
  REFRESH_TOKEN = 'refresh_token',     // Try to refresh the token
  RECONNECT = 'reconnect',             // Require user to reconnect to HMRC
  WAIT_AND_RETRY = 'wait_and_retry',   // Wait before retrying (for rate limiting)
  NOTIFY_ADMIN = 'notify_admin',       // Internal notification to administrators
  CONTACT_SUPPORT = 'contact_support', // User should contact support
  CLEAR_CACHE = 'clear_cache',         // Clear local caches/storage
  NO_ACTION = 'no_action'              // No recovery action possible
}

/**
 * Mapping of OAuth error types to recovery actions
 */
const recoveryActionMap: Record<OAuthErrorType, RecoveryAction[]> = {
  [OAuthErrorType.INVALID_REQUEST]: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT],
  [OAuthErrorType.INVALID_CLIENT]: [RecoveryAction.NOTIFY_ADMIN, RecoveryAction.CONTACT_SUPPORT],
  [OAuthErrorType.INVALID_GRANT]: [RecoveryAction.RECONNECT],
  [OAuthErrorType.UNAUTHORIZED_CLIENT]: [RecoveryAction.NOTIFY_ADMIN, RecoveryAction.CONTACT_SUPPORT],
  [OAuthErrorType.UNSUPPORTED_GRANT_TYPE]: [RecoveryAction.NOTIFY_ADMIN, RecoveryAction.CONTACT_SUPPORT],
  [OAuthErrorType.INVALID_SCOPE]: [RecoveryAction.NOTIFY_ADMIN, RecoveryAction.RECONNECT],
  [OAuthErrorType.ACCESS_DENIED]: [RecoveryAction.RECONNECT],
  [OAuthErrorType.SERVER_ERROR]: [RecoveryAction.WAIT_AND_RETRY, RecoveryAction.NOTIFY_ADMIN],
  [OAuthErrorType.TEMPORARILY_UNAVAILABLE]: [RecoveryAction.WAIT_AND_RETRY],
  [OAuthErrorType.INSUFFICIENT_SCOPE]: [RecoveryAction.RECONNECT],
  [OAuthErrorType.NETWORK_ERROR]: [RecoveryAction.RETRY, RecoveryAction.WAIT_AND_RETRY],
  [OAuthErrorType.TOKEN_EXPIRED]: [RecoveryAction.REFRESH_TOKEN, RecoveryAction.RECONNECT],
  [OAuthErrorType.UNKNOWN_ERROR]: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT]
};

/**
 * Mapping of OAuth error types to error categories
 */
const errorCategoryMap: Record<OAuthErrorType, ErrorCategory> = {
  [OAuthErrorType.INVALID_REQUEST]: ErrorCategory.CLIENT_ERROR,
  [OAuthErrorType.INVALID_CLIENT]: ErrorCategory.CONFIGURATION_ERROR,
  [OAuthErrorType.INVALID_GRANT]: ErrorCategory.AUTHENTICATION_ERROR,
  [OAuthErrorType.UNAUTHORIZED_CLIENT]: ErrorCategory.AUTHORIZATION_ERROR,
  [OAuthErrorType.UNSUPPORTED_GRANT_TYPE]: ErrorCategory.CONFIGURATION_ERROR,
  [OAuthErrorType.INVALID_SCOPE]: ErrorCategory.AUTHORIZATION_ERROR,
  [OAuthErrorType.ACCESS_DENIED]: ErrorCategory.AUTHORIZATION_ERROR,
  [OAuthErrorType.SERVER_ERROR]: ErrorCategory.SERVER_ERROR,
  [OAuthErrorType.TEMPORARILY_UNAVAILABLE]: ErrorCategory.SERVER_ERROR,
  [OAuthErrorType.INSUFFICIENT_SCOPE]: ErrorCategory.AUTHORIZATION_ERROR,
  [OAuthErrorType.NETWORK_ERROR]: ErrorCategory.NETWORK_ERROR,
  [OAuthErrorType.TOKEN_EXPIRED]: ErrorCategory.AUTHENTICATION_ERROR,
  [OAuthErrorType.UNKNOWN_ERROR]: ErrorCategory.UNKNOWN_ERROR
};

/**
 * Structured OAuth error with all relevant information
 */
export interface OAuthError {
  type: OAuthErrorType;                // The specific OAuth error type
  message: string;                     // Technical error message
  userMessage: string;                 // User-friendly message
  category: ErrorCategory;             // Error category
  recoveryActions: RecoveryAction[];   // Possible recovery actions
  timestamp: Date;                     // When the error occurred
  details?: Record<string, any>;       // Additional error details
  statusCode?: number;                 // HTTP status code if applicable
  userId?: string;                     // User ID if applicable
  requestId?: string;                  // Unique request ID for tracking
}

/**
 * Helper to determine OAuth error type from error response
 */
function determineOAuthErrorType(error: any): OAuthErrorType {
  if (!error) return OAuthErrorType.UNKNOWN_ERROR;
  
  // Handle string errors
  if (typeof error === 'string') {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
      return OAuthErrorType.NETWORK_ERROR;
    }
    if (error.toLowerCase().includes('expired')) {
      return OAuthErrorType.TOKEN_EXPIRED;
    }
    // Check for other string patterns if needed
    return OAuthErrorType.UNKNOWN_ERROR;
  }
  
  // Handle error objects with OAuth 2.0 format
  if (error.error && typeof error.error === 'string') {
    const errorType = error.error.toLowerCase();
    
    // Check if it matches a known OAuth error type
    const matchedType = Object.values(OAuthErrorType).find(
      type => type.toLowerCase() === errorType
    );
    
    if (matchedType) return matchedType as OAuthErrorType;
    
    // Special handling for specific error patterns
    if (errorType.includes('expired')) {
      return OAuthErrorType.TOKEN_EXPIRED;
    }
  }
  
  // Handle HTTP errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    if (status === 401) return OAuthErrorType.INVALID_GRANT;
    if (status === 403) return OAuthErrorType.INSUFFICIENT_SCOPE;
    if (status === 400) return OAuthErrorType.INVALID_REQUEST;
    if (status === 500) return OAuthErrorType.SERVER_ERROR;
    if (status === 503) return OAuthErrorType.TEMPORARILY_UNAVAILABLE;
  }
  
  // Fallback
  return OAuthErrorType.UNKNOWN_ERROR;
}

/**
 * HMRC OAuth Error Handler
 */
export class HmrcErrorHandler {
  private static instance: HmrcErrorHandler;
  private readonly rateLimiter;
  
  private constructor() {
    // Initialize rate limiter for authentication failures (5 failures per minute per IP)
    this.rateLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per window
    });
  }
  
  /**
   * Get the singleton instance of the error handler
   */
  public static getInstance(): HmrcErrorHandler {
    if (!HmrcErrorHandler.instance) {
      HmrcErrorHandler.instance = new HmrcErrorHandler();
    }
    return HmrcErrorHandler.instance;
  }
  
  /**
   * Create a structured OAuth error from various error types
   */
  public createOAuthError(
    error: any,
    userId?: string,
    requestId?: string,
    additionalDetails?: Record<string, any>
  ): OAuthError {
    // Determine the error type
    const errorType = determineOAuthErrorType(error);
    
    // Get error category and recovery actions
    const category = errorCategoryMap[errorType];
    const recoveryActions = recoveryActionMap[errorType];
    
    // Extract technical error message
    let techMessage = '';
    if (typeof error === 'string') {
      techMessage = error;
    } else if (error instanceof Error) {
      techMessage = error.message || error.toString();
    } else if (error.error_description) {
      techMessage = error.error_description;
    } else if (error.message) {
      techMessage = error.message;
    } else {
      techMessage = JSON.stringify(error);
    }
    
    // Status code if available
    const statusCode = error.status || error.statusCode;
    
    // Create the structured error
    const oauthError: OAuthError = {
      type: errorType,
      message: techMessage,
      userMessage: userFriendlyMessages[errorType],
      category,
      recoveryActions,
      timestamp: new Date(),
      details: {
        ...additionalDetails,
        originalError: typeof error === 'object' ? { ...error } : error
      },
      userId,
      requestId: requestId || this.generateRequestId(),
    };
    
    if (statusCode) {
      oauthError.statusCode = statusCode;
    }
    
    return oauthError;
  }
  
  /**
   * Log an OAuth error to the database and console
   */
  public async logError(error: OAuthError): Promise<string> {
    try {
      // Log to console
      console.error(`[HMRC OAuth Error] [${error.requestId || 'unknown'}] ${error.type}: ${error.message}`, {
        userId: error.userId,
        category: error.category,
        timestamp: error.timestamp,
        statusCode: error.statusCode
      });
      
      // Log to database if available
      if (supabase) {
        const { data, error: dbError } = await supabase
          .from('hmrc_error_logs')
          .insert({
            user_id: error.userId || null,
            request_id: error.requestId || `hmrc-${Date.now()}-unknown`,
            error_type: error.type,
            error_category: error.category,
            message: error.message,
            details: error.details,
            recovery_actions: error.recoveryActions,
            status_code: error.statusCode
          });
        
        if (dbError) {
          console.error('Failed to log OAuth error to database:', dbError);
        }
      }
      
      // For auth errors, increment the failure counter for rate limiting
      if (error.category === ErrorCategory.AUTHENTICATION_ERROR && error.userId) {
        await this.recordAuthFailure(error.userId);
      }
      
      return error.requestId || `hmrc-${Date.now()}-unknown`;
    } catch (e) {
      console.error('Error in OAuth error logging:', e);
      return error.requestId || `hmrc-${Date.now()}-unknown`;
    }
  }
  
  /**
   * Handle rate limiting for authentication failures
   */
  public async checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      return await this.rateLimiter.check(ipAddress);
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true }; // Fail open in case of error
    }
  }
  
  /**
   * Record an authentication failure for rate limiting
   */
  private async recordAuthFailure(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('hmrc_auth_failures')
        .insert({
          user_id: userId,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.error('Failed to record auth failure:', error);
      }
      
      // Check for suspicious activity (multiple failures)
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - 10); // Last 10 minutes
      
      const { data: recentFailures, error: countError } = await supabase
        .from('hmrc_auth_failures')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('timestamp', timeWindow.toISOString());
      
      if (!countError && recentFailures && recentFailures.length >= 10) {
        // Suspicious activity detected
        await this.flagSuspiciousActivity(userId, recentFailures.length);
      }
    } catch (error) {
      console.error('Error recording auth failure:', error);
    }
  }
  
  /**
   * Flag suspicious authentication activity for security monitoring
   */
  private async flagSuspiciousActivity(userId: string, failureCount: number): Promise<void> {
    try {
      // Log a security event
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: 'suspicious_auth_activity',
          details: {
            source: 'hmrc_oauth',
            failure_count: failureCount,
            time_window_minutes: 10
          }
        });
      
      if (error) {
        console.error('Failed to log security event:', error);
      }
      
      // This could trigger additional security measures like account lockout or admin notification
      // Implementation depends on app security requirements
    } catch (error) {
      console.error('Error flagging suspicious activity:', error);
    }
  }
  
  /**
   * Generate a unique request ID for error tracking
   */
  public generateRequestId(): string {
    return `hmrc-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Create a user-friendly error response for APIs
   */
  public createErrorResponse(error: OAuthError): {
    status: 'error';
    message: string;
    code: string;
    requestId: string;
    recoveryAction?: RecoveryAction;
  } {
    // Select the most appropriate recovery action
    const primaryRecoveryAction = error.recoveryActions.length > 0
      ? error.recoveryActions[0]
      : RecoveryAction.NO_ACTION;
    
    return {
      status: 'error',
      message: error.userMessage,
      code: error.type,
      requestId: error.requestId || `hmrc-${Date.now()}-unknown`,
      recoveryAction: primaryRecoveryAction
    };
  }
  
  /**
   * Get a user-friendly error message for a given error
   */
  public getUserFriendlyMessage(errorType: OAuthErrorType): string {
    return userFriendlyMessages[errorType] || userFriendlyMessages[OAuthErrorType.UNKNOWN_ERROR];
  }
  
  /**
   * Handle Next.js API route errors
   */
  public handleApiError(error: any, req: NextRequest, userId?: string): Response {
    // Create and log the error
    const oauthError = this.createOAuthError(error, userId);
    this.logError(oauthError).catch(err => {
      console.error('Failed to log API error:', err);
    });
    
    // Create the response
    const errorResponse = this.createErrorResponse(oauthError);
    
    // Determine HTTP status code
    let statusCode = 500; // Default server error
    
    if (oauthError.statusCode) {
      statusCode = oauthError.statusCode;
    } else {
      // Map error category to HTTP status code
      switch (oauthError.category) {
        case ErrorCategory.CLIENT_ERROR:
          statusCode = 400; // Bad Request
          break;
        case ErrorCategory.AUTHENTICATION_ERROR:
          statusCode = 401; // Unauthorized
          break;
        case ErrorCategory.AUTHORIZATION_ERROR:
          statusCode = 403; // Forbidden
          break;
        case ErrorCategory.CONFIGURATION_ERROR:
          statusCode = 500; // Server Error
          break;
        case ErrorCategory.NETWORK_ERROR:
          statusCode = 503; // Service Unavailable
          break;
        default:
          statusCode = 500; // Server Error
      }
    }
    
    return Response.json(errorResponse, { status: statusCode });
  }
}

/**
 * Comprehensive HMRC Error Handling Service
 * Maps HMRC error codes to user-friendly messages and provides recovery workflows
 */

export interface HMRCErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
  category: 'AUTH' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK' | 'BUSINESS' | 'COMPLIANCE';
  retryable: boolean;
  recoveryAction?: string;
  documentationUrl?: string;
  estimatedResolutionTime?: string;
}

export interface ErrorRecoveryWorkflow {
  errorCode: string;
  steps: RecoveryStep[];
  automaticRecovery: boolean;
  userActionRequired: boolean;
}

export interface RecoveryStep {
  id: string;
  description: string;
  action: 'retry' | 'refresh_token' | 'validate_data' | 'contact_support' | 'wait' | 'redirect';
  parameters?: Record<string, any>;
  estimatedTime?: string;
}

export interface ErrorAnalytics {
  errorCode: string;
  userId: string;
  timestamp: string;
  context: Record<string, any>;
  resolved: boolean;
  resolutionTime?: number;
  recoveryMethod?: string;
}

export class HMRCErrorHandler {
  private static instance: HMRCErrorHandler;
  private errorMappings: Map<string, HMRCErrorDetails> = new Map();
  private recoveryWorkflows: Map<string, ErrorRecoveryWorkflow> = new Map();
  private errorAnalytics: ErrorAnalytics[] = [];

  private constructor() {
    this.initializeErrorMappings();
    this.initializeRecoveryWorkflows();
  }

  public static getInstance(): HMRCErrorHandler {
    if (!HMRCErrorHandler.instance) {
      HMRCErrorHandler.instance = new HMRCErrorHandler();
    }
    return HMRCErrorHandler.instance;
  }

  private initializeErrorMappings(): void {
    this.errorMappings = new Map([
      // Authentication Errors
      ['INVALID_CREDENTIALS', {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid client credentials provided',
        userMessage: 'Authentication failed. Please reconnect to HMRC to continue.',
        severity: 'error',
        category: 'AUTH',
        retryable: false,
        recoveryAction: 'Reconnect to HMRC',
        documentationUrl: '/help/hmrc-connection',
        estimatedResolutionTime: '2 minutes'
      }],
      
      ['INVALID_TOKEN', {
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or expired',
        userMessage: 'Your HMRC connection has expired. We\'ll reconnect you automatically.',
        severity: 'warning',
        category: 'AUTH',
        retryable: true,
        recoveryAction: 'Automatic token refresh',
        estimatedResolutionTime: '30 seconds'
      }],

      ['INSUFFICIENT_SCOPE', {
        code: 'INSUFFICIENT_SCOPE',
        message: 'Token does not have required permissions',
        userMessage: 'Insufficient permissions. Please reconnect to HMRC with full access.',
        severity: 'error',
        category: 'AUTH',
        retryable: false,
        recoveryAction: 'Reconnect with full permissions',
        documentationUrl: '/help/hmrc-permissions'
      }],

      // Rate Limiting Errors
      ['RATE_LIMIT_EXCEEDED', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        severity: 'warning',
        category: 'RATE_LIMIT',
        retryable: true,
        recoveryAction: 'Wait and retry automatically',
        estimatedResolutionTime: '1-5 minutes'
      }],

      ['QUOTA_EXCEEDED', {
        code: 'QUOTA_EXCEEDED',
        message: 'Daily API quota exceeded',
        userMessage: 'Daily submission limit reached. Please try again tomorrow.',
        severity: 'error',
        category: 'RATE_LIMIT',
        retryable: false,
        recoveryAction: 'Wait until quota resets',
        estimatedResolutionTime: '24 hours'
      }],

      // Validation Errors
      ['INVALID_REQUEST', {
        code: 'INVALID_REQUEST',
        message: 'Request format or data is invalid',
        userMessage: 'Invalid data provided. Please check your information and try again.',
        severity: 'error',
        category: 'VALIDATION',
        retryable: false,
        recoveryAction: 'Correct data and resubmit',
        documentationUrl: '/help/data-validation'
      }],

      ['MISSING_REQUIRED_FIELD', {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Required field is missing',
        userMessage: 'Some required information is missing. Please complete all required fields.',
        severity: 'error',
        category: 'VALIDATION',
        retryable: false,
        recoveryAction: 'Complete missing fields'
      }],

      ['INVALID_DATE_FORMAT', {
        code: 'INVALID_DATE_FORMAT',
        message: 'Date format is incorrect',
        userMessage: 'Invalid date format. Please use DD/MM/YYYY format.',
        severity: 'error',
        category: 'VALIDATION',
        retryable: false,
        recoveryAction: 'Correct date format'
      }],

      ['INVALID_AMOUNT', {
        code: 'INVALID_AMOUNT',
        message: 'Amount value is invalid',
        userMessage: 'Invalid amount entered. Please enter a valid monetary amount.',
        severity: 'error',
        category: 'VALIDATION',
        retryable: false,
        recoveryAction: 'Correct amount value'
      }],

      // Business Logic Errors
      ['DUPLICATE_SUBMISSION', {
        code: 'DUPLICATE_SUBMISSION',
        message: 'Submission already exists for this period',
        userMessage: 'A submission for this tax year already exists.',
        severity: 'error',
        category: 'BUSINESS',
        retryable: false,
        recoveryAction: 'View existing submission or amend if needed',
        documentationUrl: '/help/amending-returns'
      }],

      ['SUBMISSION_DEADLINE_PASSED', {
        code: 'SUBMISSION_DEADLINE_PASSED',
        message: 'Submission deadline has passed',
        userMessage: 'The deadline for this tax year has passed. Late submission penalties may apply.',
        severity: 'warning',
        category: 'BUSINESS',
        retryable: true,
        recoveryAction: 'Submit with late penalty acknowledgment',
        documentationUrl: '/help/late-submissions'
      }],

      ['CALCULATION_ERROR', {
        code: 'CALCULATION_ERROR',
        message: 'Tax calculation contains errors',
        userMessage: 'There\'s an issue with the tax calculation. Please review your figures.',
        severity: 'error',
        category: 'BUSINESS',
        retryable: false,
        recoveryAction: 'Review and correct calculation data'
      }],

      // Server Errors
      ['INTERNAL_SERVER_ERROR', {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'HMRC internal server error',
        userMessage: 'HMRC service is temporarily unavailable. We\'ll retry automatically.',
        severity: 'error',
        category: 'SERVER',
        retryable: true,
        recoveryAction: 'Automatic retry with exponential backoff',
        estimatedResolutionTime: '5-30 minutes'
      }],

      ['SERVICE_UNAVAILABLE', {
        code: 'SERVICE_UNAVAILABLE',
        message: 'HMRC service is temporarily unavailable',
        userMessage: 'HMRC service is temporarily down. Your data is saved and we\'ll retry automatically.',
        severity: 'warning',
        category: 'SERVER',
        retryable: true,
        recoveryAction: 'Automatic retry when service is available',
        estimatedResolutionTime: '15-60 minutes'
      }],

      ['GATEWAY_TIMEOUT', {
        code: 'GATEWAY_TIMEOUT',
        message: 'Request timeout to HMRC service',
        userMessage: 'Request timed out. We\'ll try again automatically.',
        severity: 'warning',
        category: 'SERVER',
        retryable: true,
        recoveryAction: 'Automatic retry with longer timeout',
        estimatedResolutionTime: '1-5 minutes'
      }],

      // Network Errors
      ['NETWORK_ERROR', {
        code: 'NETWORK_ERROR',
        message: 'Network connection error',
        userMessage: 'Network connection failed. Please check your internet connection.',
        severity: 'error',
        category: 'NETWORK',
        retryable: true,
        recoveryAction: 'Check connection and retry',
        estimatedResolutionTime: '1-2 minutes'
      }],

      ['TIMEOUT', {
        code: 'TIMEOUT',
        message: 'Request timeout',
        userMessage: 'Request timed out. We\'ll try again automatically.',
        severity: 'warning',
        category: 'NETWORK',
        retryable: true,
        recoveryAction: 'Automatic retry',
        estimatedResolutionTime: '30 seconds'
      }],

      // Compliance Errors
      ['ANTI_VIRUS_CHECK_FAILED', {
        code: 'ANTI_VIRUS_CHECK_FAILED',
        message: 'Document failed anti-virus check',
        userMessage: 'Document failed security check. Please ensure files are clean and try again.',
        severity: 'error',
        category: 'COMPLIANCE',
        retryable: false,
        recoveryAction: 'Scan document and resubmit'
      }],

      ['FRAUD_PREVENTION_HEADERS_MISSING', {
        code: 'FRAUD_PREVENTION_HEADERS_MISSING',
        message: 'Required fraud prevention headers missing',
        userMessage: 'Security validation failed. Please try again.',
        severity: 'error',
        category: 'COMPLIANCE',
        retryable: true,
        recoveryAction: 'Automatic retry with correct headers',
        estimatedResolutionTime: '30 seconds'
      }]
    ]);
  }

  private initializeRecoveryWorkflows(): void {
    this.recoveryWorkflows = new Map([
      ['INVALID_TOKEN', {
        errorCode: 'INVALID_TOKEN',
        automaticRecovery: true,
        userActionRequired: false,
        steps: [
          {
            id: 'refresh_token',
            description: 'Refreshing HMRC access token',
            action: 'refresh_token',
            estimatedTime: '10 seconds'
          },
          {
            id: 'retry_request',
            description: 'Retrying original request',
            action: 'retry',
            estimatedTime: '5 seconds'
          }
        ]
      }],

      ['INVALID_CREDENTIALS', {
        errorCode: 'INVALID_CREDENTIALS',
        automaticRecovery: false,
        userActionRequired: true,
        steps: [
          {
            id: 'redirect_to_auth',
            description: 'Redirecting to HMRC authentication',
            action: 'redirect',
            parameters: { url: '/hmrc/auth' },
            estimatedTime: '2 minutes'
          }
        ]
      }],

      ['RATE_LIMIT_EXCEEDED', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        automaticRecovery: true,
        userActionRequired: false,
        steps: [
          {
            id: 'wait_for_rate_limit',
            description: 'Waiting for rate limit to reset',
            action: 'wait',
            parameters: { duration: 60000 }, // 1 minute
            estimatedTime: '1-5 minutes'
          },
          {
            id: 'retry_request',
            description: 'Retrying request',
            action: 'retry',
            estimatedTime: '5 seconds'
          }
        ]
      }],

      ['INVALID_REQUEST', {
        errorCode: 'INVALID_REQUEST',
        automaticRecovery: false,
        userActionRequired: true,
        steps: [
          {
            id: 'validate_data',
            description: 'Validating submission data',
            action: 'validate_data',
            estimatedTime: '30 seconds'
          },
          {
            id: 'show_validation_errors',
            description: 'Showing validation errors to user',
            action: 'redirect',
            parameters: { url: '/tax/validation-errors' }
          }
        ]
      }],

      ['SERVICE_UNAVAILABLE', {
        errorCode: 'SERVICE_UNAVAILABLE',
        automaticRecovery: true,
        userActionRequired: false,
        steps: [
          {
            id: 'wait_for_service',
            description: 'Waiting for HMRC service to become available',
            action: 'wait',
            parameters: { duration: 300000 }, // 5 minutes
            estimatedTime: '5-30 minutes'
          },
          {
            id: 'retry_request',
            description: 'Retrying request',
            action: 'retry',
            estimatedTime: '10 seconds'
          }
        ]
      }]
    ]);
  }

  /**
   * Map HTTP status code and error data to HMRC error details
   */
  public mapError(statusCode: number, errorData: any, originalError?: Error): HMRCErrorDetails {
    let errorCode: string;

    // Extract error code from response
    if (errorData?.code) {
      errorCode = errorData.code;
    } else {
      // Map HTTP status codes to error types
      switch (statusCode) {
        case 400:
          errorCode = errorData?.message?.includes('required') ? 'MISSING_REQUIRED_FIELD' : 'INVALID_REQUEST';
          break;
        case 401:
          errorCode = 'INVALID_TOKEN';
          break;
        case 403:
          if (errorData?.message?.includes('duplicate')) {
            errorCode = 'DUPLICATE_SUBMISSION';
          } else if (errorData?.message?.includes('scope')) {
            errorCode = 'INSUFFICIENT_SCOPE';
          } else {
            errorCode = 'INVALID_CREDENTIALS';
          }
          break;
        case 409:
          errorCode = 'DUPLICATE_SUBMISSION';
          break;
        case 422:
          errorCode = 'INVALID_REQUEST';
          break;
        case 429:
          errorCode = 'RATE_LIMIT_EXCEEDED';
          break;
        case 500:
          errorCode = 'INTERNAL_SERVER_ERROR';
          break;
        case 502:
        case 503:
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        case 504:
          errorCode = 'GATEWAY_TIMEOUT';
          break;
        default:
          if (originalError?.message.includes('timeout')) {
            errorCode = 'TIMEOUT';
          } else if (originalError?.message.includes('network') || originalError?.message.includes('ECONNRESET')) {
            errorCode = 'NETWORK_ERROR';
          } else {
            errorCode = 'INTERNAL_SERVER_ERROR';
          }
      }
    }

    const errorDetails = this.errorMappings.get(errorCode);
    
    if (errorDetails) {
      return {
        ...errorDetails,
        message: errorData?.message || errorDetails.message
      };
    }

    // Default error for unknown codes
    return {
      code: errorCode || 'UNKNOWN_ERROR',
      message: errorData?.message || `HTTP ${statusCode} error`,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      severity: 'error',
      category: 'SERVER',
      retryable: statusCode >= 500,
      recoveryAction: 'Contact support',
      estimatedResolutionTime: 'Unknown'
    };
  }

  /**
   * Get recovery workflow for an error
   */
  public getRecoveryWorkflow(errorCode: string): ErrorRecoveryWorkflow | null {
    return this.recoveryWorkflows.get(errorCode) || null;
  }

  /**
   * Check if an error is retryable
   */
  public isRetryable(errorCode: string): boolean {
    const errorDetails = this.errorMappings.get(errorCode);
    return errorDetails?.retryable || false;
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(errorCode: string): string {
    const errorDetails = this.errorMappings.get(errorCode);
    return errorDetails?.userMessage || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error for analytics
   */
  public logError(errorCode: string, userId: string, context: Record<string, any>): void {
    const analytics: ErrorAnalytics = {
      errorCode,
      userId,
      timestamp: new Date().toISOString(),
      context,
      resolved: false
    };

    this.errorAnalytics.push(analytics);

    // In production, this would send to analytics service
    console.log('Error logged for analytics:', analytics);
  }

  /**
   * Mark error as resolved
   */
  public markErrorResolved(errorCode: string, userId: string, resolutionMethod: string): void {
    const errorIndex = this.errorAnalytics.findIndex(
      error => error.errorCode === errorCode && 
               error.userId === userId && 
               !error.resolved
    );

    if (errorIndex !== -1) {
      const error = this.errorAnalytics[errorIndex];
      error.resolved = true;
      error.resolutionTime = Date.now() - new Date(error.timestamp).getTime();
      error.recoveryMethod = resolutionMethod;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStatistics(timeRange: { start: Date; end: Date }): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByCode: Record<string, number>;
    averageResolutionTime: number;
    resolutionRate: number;
  } {
    const filteredErrors = this.errorAnalytics.filter(error => {
      const errorDate = new Date(error.timestamp);
      return errorDate >= timeRange.start && errorDate <= timeRange.end;
    });

    const errorsByCategory: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    filteredErrors.forEach(error => {
      const errorDetails = this.errorMappings.get(error.errorCode);
      const category = errorDetails?.category || 'UNKNOWN';
      
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
      errorsByCode[error.errorCode] = (errorsByCode[error.errorCode] || 0) + 1;

      if (error.resolved && error.resolutionTime) {
        totalResolutionTime += error.resolutionTime;
        resolvedCount++;
      }
    });

    return {
      totalErrors: filteredErrors.length,
      errorsByCategory,
      errorsByCode,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      resolutionRate: filteredErrors.length > 0 ? resolvedCount / filteredErrors.length : 0
    };
  }

  /**
   * Create error notification for user
   */
  public createErrorNotification(errorCode: string, context?: Record<string, any>): {
    title: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    actions: Array<{ label: string; action: string; parameters?: Record<string, any> }>;
    dismissible: boolean;
    autoHide: boolean;
    duration?: number;
  } {
    const errorDetails = this.errorMappings.get(errorCode);
    const workflow = this.getRecoveryWorkflow(errorCode);

    if (!errorDetails) {
      return {
        title: 'Error',
        message: 'An unexpected error occurred.',
        severity: 'error',
        actions: [{ label: 'Contact Support', action: 'contact_support' }],
        dismissible: true,
        autoHide: false
      };
    }

    const actions: Array<{ label: string; action: string; parameters?: Record<string, any> }> = [];

    if (workflow?.automaticRecovery) {
      actions.push({ label: 'Retry Automatically', action: 'auto_retry' });
    } else if (errorDetails.retryable) {
      actions.push({ label: 'Try Again', action: 'retry' });
    }

    if (errorDetails.documentationUrl) {
      actions.push({ 
        label: 'Learn More', 
        action: 'open_documentation',
        parameters: { url: errorDetails.documentationUrl }
      });
    }

    actions.push({ label: 'Contact Support', action: 'contact_support' });

    return {
      title: this.getErrorTitle(errorDetails.category),
      message: errorDetails.userMessage,
      severity: errorDetails.severity,
      actions,
      dismissible: errorDetails.severity !== 'error',
      autoHide: errorDetails.severity === 'info',
      duration: errorDetails.severity === 'info' ? 5000 : undefined
    };
  }

  private getErrorTitle(category: string): string {
    switch (category) {
      case 'AUTH':
        return 'Authentication Issue';
      case 'VALIDATION':
        return 'Data Validation Error';
      case 'RATE_LIMIT':
        return 'Rate Limit Reached';
      case 'SERVER':
        return 'Service Temporarily Unavailable';
      case 'NETWORK':
        return 'Connection Issue';
      case 'BUSINESS':
        return 'Submission Issue';
      case 'COMPLIANCE':
        return 'Security Check Failed';
      default:
        return 'Error';
    }
  }
} 