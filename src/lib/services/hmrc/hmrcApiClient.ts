import { HmrcAuthService } from './hmrcAuthService';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HMRC API Client for Making Tax Digital
 * This client handles API calls to HMRC's MTD APIs with automatic token refresh and retry handling
 */
export class HmrcApiClient {
  private authService: HmrcAuthService;
  private baseUrl: string;
  
  constructor() {
    this.authService = HmrcAuthService.getInstance();
    // Use the appropriate environment base URL
    this.baseUrl = process.env.HMRC_API_BASE_URL || 'https://test-api.service.hmrc.gov.uk';
  }
  
  /**
   * Get a user's self assessment details
   */
  async getSelfAssessment(userId: string, taxYear: string): Promise<ApiResponse<any>> {
    try {
      // Use the executeWithRetry helper to handle token refresh automatically
      const result = await this.authService.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseUrl}/individuals/self-assessment/api/v1.0/${taxYear}`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Add required fraud prevention headers for HMRC
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
            'Gov-Client-Device-ID': this.getDeviceId(userId),
            'Gov-Client-User-IDs': `os=ZenRent-${userId}`,
            'Gov-Client-Timezone': 'UTC+00:00',
            'Gov-Client-Local-IPs': '127.0.0.1',
            'Gov-Vendor-Version': process.env.APP_VERSION || '1.0.0',
            'Gov-Vendor-Product-Name': 'ZenRent'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting self assessment data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Submit income data to HMRC
   */
  async submitIncome(userId: string, taxYear: string, incomeData: any): Promise<ApiResponse<any>> {
    try {
      const result = await this.authService.executeWithRetry(userId, async (token) => {
        // Build the API URL for income submission
        const url = `${this.baseUrl}/individuals/income/api/v1.0/${taxYear}/submit`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Add required fraud prevention headers for HMRC
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
            'Gov-Client-Device-ID': this.getDeviceId(userId),
            'Gov-Client-User-IDs': `os=ZenRent-${userId}`,
            'Gov-Client-Timezone': 'UTC+00:00',
            'Gov-Client-Local-IPs': '127.0.0.1',
            'Gov-Vendor-Version': process.env.APP_VERSION || '1.0.0',
            'Gov-Vendor-Product-Name': 'ZenRent'
          },
          body: JSON.stringify(incomeData)
        });
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(`Bad request: ${JSON.stringify(errorData)}`);
          } else if (response.status === 401) {
            throw new Error('Unauthorized - token issue');
          } else if (response.status === 403) {
            throw new Error('Forbidden - insufficient permissions');
          } else if (response.status === 429) {
            throw new Error('Rate limited - too many requests');
          } else {
            const errorData = await response.json();
            throw new Error(`HMRC API Error: ${response.status} - ${JSON.stringify(errorData)}`);
          }
        }
        
        return await response.json();
      }, 3); // Use 3 retries for important submission operations
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error submitting income data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get tax obligations from HMRC
   */
  async getTaxObligations(userId: string): Promise<ApiResponse<any>> {
    try {
      const result = await this.authService.executeWithRetry(userId, async (token) => {
        // Build the API URL
        const url = `${this.baseUrl}/individuals/obligations/api/v1.0/obligations`;
        
        // Make the API call with the token
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Add required fraud prevention headers
            'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
            'Gov-Client-Device-ID': this.getDeviceId(userId),
            'Gov-Client-User-IDs': `os=ZenRent-${userId}`,
            'Gov-Client-Timezone': 'UTC+00:00',
            'Gov-Client-Local-IPs': '127.0.0.1',
            'Gov-Vendor-Version': process.env.APP_VERSION || '1.0.0',
            'Gov-Vendor-Product-Name': 'ZenRent'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HMRC API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting tax obligations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Check if user is connected to HMRC
   */
  async isConnected(userId: string): Promise<boolean> {
    return await this.authService.isConnected(userId);
  }
  
  /**
   * Disconnect user from HMRC
   */
  async disconnect(userId: string): Promise<boolean> {
    return await this.authService.disconnect(userId);
  }
  
  /**
   * Generate a consistent device ID for HMRC fraud prevention headers
   */
  private getDeviceId(userId: string): string {
    // In production, this should use a more sophisticated device fingerprinting approach
    // For now, we'll generate a consistent ID based on the user ID
    return `zenrent-device-${userId.substring(0, 8)}`;
  }
} 