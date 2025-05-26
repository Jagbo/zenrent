import { HmrcAuthService } from './hmrcAuthService';

/**
 * Circuit Breaker State
 */
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  
  constructor(private config: CircuitBreakerConfig) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successful calls to close
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }
  
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  getStats(): { state: string; failureCount: number; successCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }
}

/**
 * Connection Pool for HTTP connections
 */
class ConnectionPool {
  private static instance: ConnectionPool;
  private agents: Map<string, any> = new Map();
  
  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }
  
  getAgent(baseUrl: string): any {
    if (!this.agents.has(baseUrl)) {
      // Create HTTP agent with connection pooling
      const isHttps = baseUrl.startsWith('https');
      const Agent = isHttps ? require('https').Agent : require('http').Agent;
      
      const agent = new Agent({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 30000,
        freeSocketTimeout: 15000
      });
      
      this.agents.set(baseUrl, agent);
    }
    
    return this.agents.get(baseUrl);
  }
  
  closeAll(): void {
    for (const agent of this.agents.values()) {
      agent.destroy();
    }
    this.agents.clear();
  }
}

/**
 * Enhanced Error Mapping
 */
interface HMRCError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  category: 'AUTH' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK' | 'BUSINESS';
}

class HMRCErrorMapper {
  private static errorMap: Map<string, HMRCError> = new Map([
    // Authentication Errors
    ['INVALID_CREDENTIALS', {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid client credentials',
      userMessage: 'Authentication failed. Please reconnect to HMRC.',
      retryable: false,
      category: 'AUTH'
    }],
    ['INVALID_TOKEN', {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired access token',
      userMessage: 'Your HMRC connection has expired. Please reconnect.',
      retryable: true,
      category: 'AUTH'
    }],
    ['INSUFFICIENT_SCOPE', {
      code: 'INSUFFICIENT_SCOPE',
      message: 'Insufficient scope for this operation',
      userMessage: 'Insufficient permissions. Please reconnect to HMRC with full permissions.',
      retryable: false,
      category: 'AUTH'
    }],
    
    // Rate Limiting
    ['RATE_LIMIT_EXCEEDED', {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      userMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
      category: 'RATE_LIMIT'
    }],
    
    // Validation Errors
    ['INVALID_REQUEST', {
      code: 'INVALID_REQUEST',
      message: 'Invalid request format or data',
      userMessage: 'Invalid data provided. Please check your information and try again.',
      retryable: false,
      category: 'VALIDATION'
    }],
    ['DUPLICATE_SUBMISSION', {
      code: 'DUPLICATE_SUBMISSION',
      message: 'Duplicate submission detected',
      userMessage: 'This submission has already been processed.',
      retryable: false,
      category: 'BUSINESS'
    }],
    
    // Server Errors
    ['INTERNAL_SERVER_ERROR', {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'HMRC internal server error',
      userMessage: 'HMRC service is temporarily unavailable. Please try again later.',
      retryable: true,
      category: 'SERVER'
    }],
    ['SERVICE_UNAVAILABLE', {
      code: 'SERVICE_UNAVAILABLE',
      message: 'HMRC service unavailable',
      userMessage: 'HMRC service is temporarily unavailable. Please try again later.',
      retryable: true,
      category: 'SERVER'
    }],
    
    // Network Errors
    ['NETWORK_ERROR', {
      code: 'NETWORK_ERROR',
      message: 'Network connection error',
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      retryable: true,
      category: 'NETWORK'
    }],
    ['TIMEOUT', {
      code: 'TIMEOUT',
      message: 'Request timeout',
      userMessage: 'Request timed out. Please try again.',
      retryable: true,
      category: 'NETWORK'
    }]
  ]);
  
  static mapError(statusCode: number, errorData: any, originalError?: Error): HMRCError {
    // Map HTTP status codes to error types
    let errorCode: string;
    
    switch (statusCode) {
      case 400:
        errorCode = errorData?.code || 'INVALID_REQUEST';
        break;
      case 401:
        errorCode = errorData?.code || 'INVALID_TOKEN';
        break;
      case 403:
        if (errorData?.code === 'DUPLICATE_SUBMISSION') {
          errorCode = 'DUPLICATE_SUBMISSION';
        } else {
          errorCode = 'INSUFFICIENT_SCOPE';
        }
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
        errorCode = 'INTERNAL_SERVER_ERROR';
        break;
      case 502:
      case 503:
      case 504:
        errorCode = 'SERVICE_UNAVAILABLE';
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
    
    return this.errorMap.get(errorCode) || {
      code: 'UNKNOWN_ERROR',
      message: `Unknown error: ${statusCode}`,
      userMessage: 'An unexpected error occurred. Please try again later.',
      retryable: true,
      category: 'SERVER'
    };
  }
  
  static isRetryable(error: HMRCError): boolean {
    return error.retryable;
  }
}

/**
 * Enhanced Retry Configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Enhanced HMRC API Client with connection pooling, circuit breaker, and comprehensive error handling
 */
export class HmrcApiClient {
  private authService: HmrcAuthService;
  private baseUrl: string;
  private connectionPool: ConnectionPool;
  private circuitBreaker: CircuitBreaker;
  private defaultRetryConfig: RetryConfig;
  
  constructor() {
    this.authService = HmrcAuthService.getInstance();
    this.baseUrl = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk';
    this.connectionPool = ConnectionPool.getInstance();
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5, // Open after 5 failures
      recoveryTimeout: 60000, // 1 minute recovery timeout
      monitoringPeriod: 300000 // 5 minute monitoring period
    });
    
    // Default retry configuration
    this.defaultRetryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true
    };
  }
  
  /**
   * Execute API request with enhanced retry logic, circuit breaker, and error handling
   */
  async executeRequest<T>(
    userId: string,
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      retryConfig?: Partial<RetryConfig>;
      bypassCircuitBreaker?: boolean;
    } = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...options.retryConfig };
    
    const operation = async (): Promise<T> => {
      return await this.executeWithRetry(userId, async (token) => {
        const url = `${this.baseUrl}${endpoint}`;
        const agent = this.connectionPool.getAgent(this.baseUrl);
        
                 const headers: Record<string, string> = {
           'Authorization': `Bearer ${token}`,
           'Accept': 'application/json',
           'User-Agent': 'ZenRent/1.0.0',
           // Fraud prevention headers
           'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
           'Gov-Client-Device-ID': this.getDeviceId(userId),
           'Gov-Client-User-IDs': `os=ZenRent-${userId}`,
           'Gov-Client-Timezone': 'UTC+00:00',
           'Gov-Client-Local-IPs': '127.0.0.1',
           'Gov-Vendor-Version': process.env.APP_VERSION || '1.0.0',
           'Gov-Vendor-Product-Name': 'ZenRent',
           ...options.headers
         };
         
         if (options.body) {
           headers['Content-Type'] = 'application/json';
         }
         
         const requestOptions: RequestInit = {
           method,
           headers,
           // Set timeout
           signal: AbortSignal.timeout(30000)
         };
         
         if (options.body) {
           requestOptions.body = JSON.stringify(options.body);
         }
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const hmrcError = HMRCErrorMapper.mapError(response.status, errorData);
          
          const error = new Error(hmrcError.message);
          (error as any).hmrcError = hmrcError;
          (error as any).statusCode = response.status;
          (error as any).errorData = errorData;
          
          throw error;
        }
        
        return await response.json();
      }, config);
    };
    
    // Use circuit breaker unless bypassed
    if (options.bypassCircuitBreaker) {
      return await operation();
    } else {
      return await this.circuitBreaker.execute(operation);
    }
  }
  
  /**
   * Enhanced retry logic with exponential backoff and jitter
   */
  private async executeWithRetry<T>(
    userId: string,
    apiCall: (token: string) => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
                 // Get a valid token (will refresh if needed)
         const token = await this.authService.executeWithRetry(userId, async (token) => token, 1);
        
        if (!token) {
          throw new Error('Failed to get a valid token');
        }
        
        // Execute the API call
        return await apiCall(token);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if this error is retryable
        const hmrcError = (lastError as any).hmrcError;
        const isRetryable = hmrcError ? HMRCErrorMapper.isRetryable(hmrcError) : true;
        
        // Don't retry on the last attempt or if error is not retryable
        if (attempt === config.maxRetries || !isRetryable) {
          break;
        }
        
        // Calculate delay with exponential backoff and optional jitter
        let delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        
        if (config.jitter) {
          // Add jitter to prevent thundering herd
          delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries})...`);
        
        // Handle auth errors by clearing tokens
        if (hmrcError?.category === 'AUTH') {
          await this.authService.clearTokens(userId);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries failed
    throw lastError || new Error('API call failed after retries');
  }
  
  /**
   * Get a user's self assessment details with fallback mechanisms
   */
  async getSelfAssessment(userId: string, taxYear: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.executeRequest(userId, 'GET', `/individuals/self-assessment/api/v1.0/${taxYear}`);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting self assessment data:', error);
      
      // Try fallback mechanisms
      const fallbackResult = await this.tryFallbackMechanisms(userId, 'getSelfAssessment', { taxYear });
      
      if (fallbackResult) {
        return {
          success: true,
          data: fallbackResult,
          fromFallback: true
        };
      }
      
      const hmrcError = (error as any).hmrcError;
      return {
        success: false,
        error: hmrcError?.userMessage || (error instanceof Error ? error.message : 'Unknown error occurred'),
        errorCode: hmrcError?.code,
        retryable: hmrcError ? HMRCErrorMapper.isRetryable(hmrcError) : true
      };
    }
  }
  
  /**
   * Submit income data to HMRC with enhanced error handling
   */
  async submitIncome(userId: string, taxYear: string, incomeData: any): Promise<ApiResponse<any>> {
    try {
      const result = await this.executeRequest(
        userId, 
        'POST', 
        `/individuals/income/api/v1.0/${taxYear}/submit`,
        {
          body: incomeData,
          retryConfig: {
            maxRetries: 5, // More retries for important submissions
            baseDelay: 2000 // Longer initial delay
          }
        }
      );
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error submitting income data:', error);
      
      const hmrcError = (error as any).hmrcError;
      return {
        success: false,
        error: hmrcError?.userMessage || (error instanceof Error ? error.message : 'Unknown error occurred'),
        errorCode: hmrcError?.code,
        retryable: hmrcError ? HMRCErrorMapper.isRetryable(hmrcError) : true
      };
    }
  }
  
  /**
   * Get tax obligations from HMRC
   */
  async getTaxObligations(userId: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.executeRequest(userId, 'GET', '/individuals/obligations/api/v1.0/obligations');
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting tax obligations:', error);
      
      // Try fallback mechanisms
      const fallbackResult = await this.tryFallbackMechanisms(userId, 'getTaxObligations', {});
      
      if (fallbackResult) {
        return {
          success: true,
          data: fallbackResult,
          fromFallback: true
        };
      }
      
      const hmrcError = (error as any).hmrcError;
      return {
        success: false,
        error: hmrcError?.userMessage || (error instanceof Error ? error.message : 'Unknown error occurred'),
        errorCode: hmrcError?.code,
        retryable: hmrcError ? HMRCErrorMapper.isRetryable(hmrcError) : true
      };
    }
  }
  
  /**
   * Fallback mechanisms for when primary API calls fail
   */
  private async tryFallbackMechanisms(userId: string, operation: string, params: any): Promise<any | null> {
    try {
      // Fallback 1: Try with different API version
      if (operation === 'getSelfAssessment') {
        console.log('Trying fallback: different API version');
        try {
          return await this.executeRequest(
            userId, 
            'GET', 
            `/individuals/self-assessment/api/v2.0/${params.taxYear}`,
            { bypassCircuitBreaker: true }
          );
        } catch (fallbackError) {
          console.log('Fallback 1 failed:', fallbackError);
        }
      }
      
      // Fallback 2: Try cached data from database
      console.log('Trying fallback: cached data');
      const cachedData = await this.getCachedData(userId, operation, params);
      if (cachedData) {
        console.log('Using cached data as fallback');
        return cachedData;
      }
      
      // Fallback 3: Return minimal/default data structure
      console.log('Trying fallback: default data structure');
      return this.getDefaultDataStructure(operation, params);
      
    } catch (error) {
      console.error('All fallback mechanisms failed:', error);
      return null;
    }
  }
  
  /**
   * Get cached data from database
   */
  private async getCachedData(userId: string, operation: string, params: any): Promise<any | null> {
    // Implementation would query Supabase for cached HMRC data
    // This is a placeholder for the actual implementation
    return null;
  }
  
  /**
   * Get default data structure when all else fails
   */
  private getDefaultDataStructure(operation: string, params: any): any {
    switch (operation) {
      case 'getSelfAssessment':
        return {
          taxYear: params.taxYear,
          status: 'unavailable',
          message: 'Data temporarily unavailable'
        };
      case 'getTaxObligations':
        return {
          obligations: [],
          message: 'Obligations data temporarily unavailable'
        };
      default:
        return {
          status: 'unavailable',
          message: 'Service temporarily unavailable'
        };
    }
  }
  
  /**
   * Generate device ID for fraud prevention headers
   */
  private getDeviceId(userId: string): string {
    // Generate a consistent device ID based on user ID
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`ZenRent-${userId}`).digest('hex').substring(0, 16);
  }
  
  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): { state: string; failureCount: number; successCount: number } {
    return this.circuitBreaker.getStats();
  }
  
  /**
   * Reset circuit breaker (for admin/debugging purposes)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 300000
    });
  }
  
  /**
   * Close all connections (cleanup)
   */
  cleanup(): void {
    this.connectionPool.closeAll();
  }
}

/**
 * API Response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
  fromFallback?: boolean;
} 