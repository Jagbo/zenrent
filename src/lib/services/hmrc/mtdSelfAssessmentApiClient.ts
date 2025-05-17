import { HmrcApiClient } from './hmrcApiClient';
import { HmrcAuthService } from './hmrcAuthService';
import { SelfAssessmentPayload } from './transformers/types';

export interface SaObligation {
  start: string;
  end: string;
  due: string;
  status: 'Open' | 'Fulfilled' | 'Overdue';
  type: 'SelfAssessment' | 'Crystallisation';
  periodId: string;
  received?: string;
}

export interface TaxCalculation {
  calculationId: string;
  calculationTimestamp: string;
  calculationType: string;
  taxYear: string;
  incomeTaxAndNicsCalculated: number;
  totalIncomeTaxAndNicsDue: number;
  totalTaxable: number;
  incomeTax: {
    totalAmount: number;
    payPensionsProfit: {
      totalAmount: number;
      taxBands: Array<{
        name: string;
        rate: number;
        income: number;
        taxAmount: number;
      }>;
    };
  };
  taxableIncome: {
    totalIncomeReceived: number;
    incomeReceived: {
      employment: number;
      selfEmployment: number;
      ukProperty: number;
      ukDividends: number;
      savings: number;
    };
    totalAllowancesAndDeductions: number;
    allowancesAndDeductions: {
      personalAllowance: number;
      reducedPersonalAllowance: number;
    };
  };
}

export interface SubmissionResponse {
  transactionReference: string;
  links?: {
    self: {
      href: string;
      method: string;
    };
  };
}

/**
 * MTD Self Assessment API Client
 * Handles interactions with HMRC's Making Tax Digital Self Assessment APIs
 */
export class MtdSelfAssessmentApiClient extends HmrcApiClient {
  private baseSelfAssessmentUrl: string;
  
  constructor() {
    super();
    // Use the appropriate environment base URL
    this.baseSelfAssessmentUrl = `${process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk'}/individuals/self-assessment`;
  }
  
  /**
   * Get self assessment obligations for a specific taxpayer
   * @param userId - User ID for authentication
   * @param nino - National Insurance Number
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @param type - Type of obligation to return (optional)
   */
  async getObligations(
    userId: string,
    nino: string,
    from: string,
    to: string,
    type?: 'SelfAssessment' | 'Crystallisation'
  ): Promise<SaObligation[]> {
    try {
      // Build the query parameters
      const queryParams = new URLSearchParams({
        from,
        to
      });
      
      // Add optional type parameter if provided
      if (type) {
        queryParams.append('type', type);
      }
      
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseSelfAssessmentUrl}/obligations/${nino}?${queryParams.toString()}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC Self Assessment API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        return data.obligations || [];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting self assessment obligations:', error);
      throw error;
    }
  }
  
  /**
   * Submit self assessment to HMRC
   * @param userId - User ID for authentication
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   * @param payload - Self assessment payload
   */
  async submitSelfAssessment(
    userId: string,
    nino: string,
    taxYear: string,
    payload: SelfAssessmentPayload
  ): Promise<SubmissionResponse> {
    try {
      // Execute the API call with automatic token refresh and more retries for important submissions
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseSelfAssessmentUrl}/income/${nino}/${taxYear}`;
        
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
            throw new Error('Duplicate submission - this self assessment has already been submitted');
          } else if (response.status === 422) {
            const errorData = await response.json();
            throw new Error(`Validation error: ${JSON.stringify(errorData)}`);
          } else {
            const errorData = await response.json();
            throw new Error(`HMRC Self Assessment API Error: ${response.status} - ${JSON.stringify(errorData)}`);
          }
        }
        
        return await response.json();
      }, 3); // Use 3 retries for important submission operations
      
      return result;
    } catch (error) {
      console.error('Error submitting self assessment:', error);
      throw error;
    }
  }
  
  /**
   * Get tax calculation for a specific taxpayer and tax year
   * @param userId - User ID for authentication
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   */
  async getTaxCalculation(
    userId: string,
    nino: string,
    taxYear: string
  ): Promise<TaxCalculation> {
    try {
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // First, trigger a calculation if needed
        const triggerUrl = `${this.baseSelfAssessmentUrl}/calculations/${nino}/${taxYear}`;
        
        const triggerResponse = await fetch(triggerUrl, {
          method: 'POST',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!triggerResponse.ok && triggerResponse.status !== 409) {
          // 409 means calculation already exists, which is fine
          const errorData = await triggerResponse.json();
          throw new Error(`HMRC Self Assessment API Error: ${triggerResponse.status} - ${JSON.stringify(errorData)}`);
        }
        
        // Get the calculation ID from the response or fetch the latest calculation ID
        let calculationId;
        
        if (triggerResponse.status === 201) {
          const triggerData = await triggerResponse.json();
          calculationId = triggerData.calculationId;
        } else {
          // Get the latest calculation ID
          const listUrl = `${this.baseSelfAssessmentUrl}/calculations/${nino}/${taxYear}`;
          
          const listResponse = await fetch(listUrl, {
            method: 'GET',
            headers: this.buildHeaders(token, userId)
          });
          
          if (!listResponse.ok) {
            const errorData = await listResponse.json();
            throw new Error(`HMRC Self Assessment API Error: ${listResponse.status} - ${JSON.stringify(errorData)}`);
          }
          
          const listData = await listResponse.json();
          const calculations = listData.calculations || [];
          
          if (calculations.length === 0) {
            throw new Error('No calculations found for this tax year');
          }
          
          // Sort by timestamp descending and get the latest
          calculations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          calculationId = calculations[0].calculationId;
        }
        
        // Now get the calculation details
        const detailsUrl = `${this.baseSelfAssessmentUrl}/calculations/${nino}/${taxYear}/${calculationId}`;
        
        const detailsResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: this.buildHeaders(token, userId)
        });
        
        if (!detailsResponse.ok) {
          const errorData = await detailsResponse.json();
          throw new Error(`HMRC Self Assessment API Error: ${detailsResponse.status} - ${JSON.stringify(errorData)}`);
        }
        
        return await detailsResponse.json();
      });
      
      return result;
    } catch (error) {
      console.error('Error getting tax calculation:', error);
      throw error;
    }
  }
  
  /**
   * Submit crystallization for a tax year
   * @param userId - User ID for authentication
   * @param nino - National Insurance Number
   * @param taxYear - Tax year (e.g., "2023-24")
   * @param calculationId - ID of the calculation to crystallize
   */
  async submitCrystallization(
    userId: string,
    nino: string,
    taxYear: string,
    calculationId: string
  ): Promise<SubmissionResponse> {
    try {
      // Execute the API call with automatic token refresh
      const result = await this.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseSelfAssessmentUrl}/crystallisation/${nino}/${taxYear}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...this.buildHeaders(token, userId),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            calculationId,
            crystallise: true
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC Self Assessment API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      return result;
    } catch (error) {
      console.error('Error submitting crystallization:', error);
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
