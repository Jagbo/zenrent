import { createClient } from '@supabase/supabase-js';
import { 
  ClientData, 
  UserData, 
  FraudPreventionHeaders,
  ScreenInfo,
  WindowSize,
  BrowserPlugin
} from './types';
import { HeaderRequirement, getHeadersByRequirement } from './hmrcHeaderSpecification';
import { validateAndEncodeHeaders, ValidationResult } from './headerValidator';

/**
 * Service for generating HMRC fraud prevention headers
 * 
 * This service is responsible for generating the fraud prevention headers
 * required by HMRC APIs based on client data and user information.
 */
export class FraudPreventionHeaderService {
  private static instance: FraudPreventionHeaderService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): FraudPreventionHeaderService {
    if (!FraudPreventionHeaderService.instance) {
      FraudPreventionHeaderService.instance = new FraudPreventionHeaderService();
    }
    return FraudPreventionHeaderService.instance;
  }
  
  /**
   * Get client data for a user from the database
   */
  public async getClientData(userId: string): Promise<ClientData | null> {
    try {
      const supabase = this.createServerSupabaseClient();
      
      // Get client data from the database
      const { data, error } = await supabase
        .from('hmrc_client_data')
        .select('client_data')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        console.error('Error retrieving client data:', error);
        return null;
      }
      
      return data.client_data as ClientData;
    } catch (error) {
      console.error('Error in getClientData:', error);
      return null;
    }
  }
  
  /**
   * Generate all required fraud prevention headers
   */
  public async generateHeaders(
    userId: string, 
    clientData?: ClientData
  ): Promise<FraudPreventionHeaders | null> {
    try {
      // If client data is not provided, try to get it from the database
      const data = clientData || await this.getClientData(userId);
      
      if (!data) {
        console.error('No client data available for user:', userId);
        return null;
      }
      
      // Create user data object
      const userData: UserData = {
        userId,
        // Add other user IDs if available
        osUserId: userId,
        platformUserId: userId,
        vendorUserId: data.vendor.name + '-' + userId.substring(0, 8)
      };
      
      // Generate all headers
      const headers: Partial<FraudPreventionHeaders> = {
        'Gov-Client-Device-ID': this.generateDeviceIdHeader(data),
        'Gov-Client-User-IDs': this.generateUserIdsHeader(userData),
        'Gov-Client-Timezone': this.generateTimezoneHeader(data),
        'Gov-Client-Connection-Method': this.generateConnectionMethodHeader(data),
        'Gov-Vendor-Version': this.generateVendorVersionHeader(data)
      };
      
      // Add optional headers if data is available
      if (data.browser.localIps && data.browser.localIps.length > 0) {
        headers['Gov-Client-Local-IPs'] = this.generateLocalIpsHeader(data);
      }
      
      if (data.browser.screenInfo) {
        headers['Gov-Client-Screens'] = this.generateScreensHeader(data);
      }
      
      if (data.browser.windowSize) {
        headers['Gov-Client-Window-Size'] = this.generateWindowSizeHeader(data);
      }
      
      if (data.browser.userAgent) {
        headers['Gov-Client-Browser-JS-User-Agent'] = this.generateUserAgentHeader(data);
      }
      
      if (data.browser.plugins && data.browser.plugins.length > 0) {
        headers['Gov-Client-Browser-Plugins'] = this.generatePluginsHeader(data);
      }
      
      headers['Gov-Client-Browser-Do-Not-Track'] = this.generateDoNotTrackHeader(data);
      
      if (data.vendor.licenseIds && data.vendor.licenseIds.length > 0) {
        headers['Gov-Vendor-License-IDs'] = this.generateLicenseIdsHeader(data);
      }
      
      // Validate and encode all headers
      const { headers: validatedHeaders, validation } = validateAndEncodeHeaders(headers as FraudPreventionHeaders);
      
      // Log any validation errors
      if (!validation.valid) {
        console.warn('Fraud prevention header validation errors:', validation.errors);
      }
      
      return validatedHeaders;
    } catch (error) {
      console.error('Error generating fraud prevention headers:', error);
      return null;
    }
  }
  
  /**
   * Generate the Device ID header
   */
  private generateDeviceIdHeader(data: ClientData): string {
    return `${data.device.deviceType}=${data.device.deviceId}`;
  }
  
  /**
   * Generate the User IDs header
   */
  private generateUserIdsHeader(userData: UserData): string {
    const parts: string[] = [];
    
    if (userData.osUserId) {
      parts.push(`os=${userData.osUserId}`);
    }
    
    if (userData.platformUserId) {
      parts.push(`platform=${userData.platformUserId}`);
    }
    
    if (userData.vendorUserId) {
      parts.push(`vendor=${userData.vendorUserId}`);
    }
    
    // Always include the main user ID
    if (!parts.length) {
      parts.push(`vendor=${userData.userId}`);
    }
    
    return parts.join('&');
  }
  
  /**
   * Generate the Timezone header
   */
  private generateTimezoneHeader(data: ClientData): string {
    return data.browser.timezone || 'UTC';
  }
  
  /**
   * Generate the Local IPs header
   */
  private generateLocalIpsHeader(data: ClientData): string {
    return data.browser.localIps ? data.browser.localIps.join(',') : '';
  }
  
  /**
   * Generate the Screens header
   */
  private generateScreensHeader(data: ClientData): string {
    const screen = data.browser.screenInfo;
    return `width=${screen.width}&height=${screen.height}&scaling-factor=${screen.scalingFactor}&colour-depth=${screen.colorDepth}`;
  }
  
  /**
   * Generate the Window Size header
   */
  private generateWindowSizeHeader(data: ClientData): string {
    const window = data.browser.windowSize;
    return `width=${window.width}&height=${window.height}`;
  }
  
  /**
   * Generate the User Agent header
   */
  private generateUserAgentHeader(data: ClientData): string {
    return data.browser.userAgent;
  }
  
  /**
   * Generate the Plugins header
   */
  private generatePluginsHeader(data: ClientData): string {
    return data.browser.plugins.map(plugin => plugin.name).join(',');
  }
  
  /**
   * Generate the Do Not Track header
   */
  private generateDoNotTrackHeader(data: ClientData): string {
    return data.browser.doNotTrack ? 'true' : 'false';
  }
  
  /**
   * Generate the Connection Method header
   */
  private generateConnectionMethodHeader(data: ClientData): string {
    return data.connectionMethod;
  }
  
  /**
   * Generate the Vendor Version header
   */
  private generateVendorVersionHeader(data: ClientData): string {
    const vendor = data.vendor;
    return `${vendor.name}&${vendor.productName}&${vendor.productVersion}`;
  }
  
  /**
   * Generate the License IDs header
   */
  private generateLicenseIdsHeader(data: ClientData): string {
    return data.vendor.licenseIds ? data.vendor.licenseIds.join(',') : '';
  }
  
  /**
   * Validate that all required headers are present and properly formatted
   */
  public validateHeaders(headers: FraudPreventionHeaders): { valid: boolean; missing: string[]; errors: string[] } {
    // Check for missing required headers
    const requiredHeaders = getHeadersByRequirement(HeaderRequirement.REQUIRED);
    const missingHeaders: string[] = [];
    
    for (const header of requiredHeaders) {
      if (!headers[header.name as keyof FraudPreventionHeaders]) {
        missingHeaders.push(header.name);
      }
    }
    
    // Validate header format and encoding
    const { validation } = validateAndEncodeHeaders(headers);
    const formatErrors = validation.errors.map(err => `${err.header}: ${err.error}`);
    
    return {
      valid: missingHeaders.length === 0 && validation.valid,
      missing: missingHeaders,
      errors: formatErrors
    };
  }
  
  /**
   * Create Supabase client for server-side operations
   */
  private createServerSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return createClient(supabaseUrl, supabaseServiceKey);
  }
}
