import { HmrcApiClient } from './hmrcApiClient';
import { HmrcAuthService } from './hmrcAuthService';
import { VatReturnPayload } from './transformers/types';

export interface VatObligation {
  start: string;
  end: string;
  due: string;
  status: 'O' | 'F'; // Open or Fulfilled
  periodKey: string;
  received?: string;
}

export interface VatLiability {
  taxPeriod: {
    from: string;
    to: string;
  };
  type: string;
  originalAmount: number;
  outstandingAmount: number;
  due: string;
}

export interface VatPayment {
  amount: number;
  received: string;
  taxPeriod: {
    from: string;
    to: string;
  };
}

export interface SubmissionResponse {
  processingDate: string;
  formBundleNumber: string;
  paymentIndicator?: string;
  chargeRefNumber?: string;
}

/**
 * MTD VAT API Client
 * Handles interactions with HMRC's Making Tax Digital VAT APIs
 */
export class MtdVatApiClient extends HmrcApiClient {
  private baseVatUrl: string;
  
  constructor() {
    super();
    // Use the appropriate environment base URL
    this.baseVatUrl = `${process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'}/organisations/vat`;
  }
  
  /**
   * Get VAT obligations for a specific VAT registered business
   * @param userId - User ID for authentication
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @param status - Status of obligations to return (optional)
   */
  async getObligations(
    userId: string,
    vrn: string,
    from: string,
    to: string,
    status?: 'O' | 'F'
  ): Promise<VatObligation[]> {
    try {
      // Build the query parameters
      const queryParams = new URLSearchParams({
        from,
        to
      });
      
      // Add optional status parameter if provided
      if (status) {
        queryParams.append('status', status);
      }
      
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseVatUrl}/${vrn}/obligations?${queryParams.toString()}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC VAT API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        return data.obligations || [];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting VAT obligations:', error);
      throw error;
    }
  }
  
  /**
   * Submit a VAT return to HMRC
   * @param userId - User ID for authentication
   * @param vrn - VAT Registration Number
   * @param payload - VAT return payload
   */
  async submitVatReturn(
    userId: string,
    vrn: string,
    payload: VatReturnPayload
  ): Promise<SubmissionResponse> {
    try {
      // Execute the API call with automatic token refresh and more retries for important submissions
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseVatUrl}/${vrn}/returns`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...this.buildHeaders(token, userId),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(`Bad request: ${JSON.stringify(errorData)}`);
          } else if (response.status === 403) {
            throw new Error('Duplicate submission - this VAT return has already been submitted');
          } else if (response.status === 422) {
            const errorData = await response.json();
            throw new Error(`Validation error: ${JSON.stringify(errorData)}`);
          } else {
            const errorData = await response.json();
            throw new Error(`HMRC VAT API Error: ${response.status} - ${JSON.stringify(errorData)}`);
          }
        }
        
        return await response.json();
      }, 3); // Use 3 retries for important submission operations
      
      return result;
    } catch (error) {
      console.error('Error submitting VAT return:', error);
      throw error;
    }
  }
  
  /**
   * Get VAT liabilities for a specific VAT registered business
   * @param userId - User ID for authentication
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getVatLiabilities(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatLiability[]> {
    try {
      // Build the query parameters
      const queryParams = new URLSearchParams({
        from,
        to
      });
      
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseVatUrl}/${vrn}/liabilities?${queryParams.toString()}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC VAT API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        return data.liabilities || [];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting VAT liabilities:', error);
      throw error;
    }
  }
  
  /**
   * Get VAT payments for a specific VAT registered business
   * @param userId - User ID for authentication
   * @param vrn - VAT Registration Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   */
  async getVatPayments(
    userId: string,
    vrn: string,
    from: string,
    to: string
  ): Promise<VatPayment[]> {
    try {
      // Build the query parameters
      const queryParams = new URLSearchParams({
        from,
        to
      });
      
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseVatUrl}/${vrn}/payments?${queryParams.toString()}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC VAT API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        return data.payments || [];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting VAT payments:', error);
      throw error;
    }
  }
  
  /**
   * Build standard headers for HMRC API requests
   * @param token - OAuth access token
   * @param userId - User ID for device identification
   */
  private buildHeaders(token: string, userId: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.hmrc.1.0+json',
      // Add required fraud prevention headers for HMRC
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': this.getDeviceId(userId),
      'Gov-Client-User-IDs': `os=ZenRent-${userId}`,
      'Gov-Client-Timezone': 'UTC+00:00',
      'Gov-Client-Local-IPs': '127.0.0.1',
      'Gov-Vendor-Version': process.env.APP_VERSION || '1.0.0',
      'Gov-Vendor-Product-Name': 'ZenRent'
    };
  }
  
  /**
   * Execute a function with automatic token refresh
   * This is a utility method that wraps the auth service's executeWithRetry
   */
  private async executeWithRetry<T>(
    userId: string,
    apiCall: (token: string) => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    const authService = HmrcAuthService.getInstance();
    return await authService.executeWithRetry(userId, apiCall, maxRetries);
  }
}
