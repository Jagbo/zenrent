import { FraudPreventionHeaders } from './types';
import { HeaderSpecification, getHeaderByName } from './hmrcHeaderSpecification';

/**
 * HMRC Fraud Prevention Header Validator
 * 
 * This utility validates and encodes HMRC fraud prevention headers to ensure
 * they meet HMRC's specifications and are properly formatted.
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  header: string;
  error: string;
}

/**
 * Validates and encodes all fraud prevention headers
 * 
 * @param headers The headers to validate and encode
 * @returns The validated and encoded headers
 */
export function validateAndEncodeHeaders(headers: FraudPreventionHeaders): { 
  headers: FraudPreventionHeaders; 
  validation: ValidationResult;
} {
  const encodedHeaders: Partial<FraudPreventionHeaders> = {};
  const errors: ValidationError[] = [];
  
  // Process each header
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;
    
    // Get the header specification
    const spec = getHeaderByName(key);
    
    if (!spec) {
      errors.push({
        header: key,
        error: 'Unknown header'
      });
      continue;
    }
    
    // Validate and encode the header value
    try {
      const encodedValue = validateAndEncodeHeader(key, value, spec);
      encodedHeaders[key as keyof FraudPreventionHeaders] = encodedValue;
    } catch (error) {
      errors.push({
        header: key,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  }
  
  return {
    headers: encodedHeaders as FraudPreventionHeaders,
    validation: {
      valid: errors.length === 0,
      errors
    }
  };
}

/**
 * Validates and encodes a single header value
 * 
 * @param name The header name
 * @param value The header value
 * @param spec The header specification
 * @returns The validated and encoded header value
 */
function validateAndEncodeHeader(
  name: string, 
  value: string, 
  spec: HeaderSpecification
): string {
  // Validate the header value based on its format
  switch (name) {
    case 'Gov-Client-Device-ID':
      return validateDeviceIdHeader(value);
    
    case 'Gov-Client-User-IDs':
      return validateUserIdsHeader(value);
    
    case 'Gov-Client-Timezone':
      return validateTimezoneHeader(value);
    
    case 'Gov-Client-Local-IPs':
      return validateLocalIpsHeader(value);
    
    case 'Gov-Client-Screens':
      return validateScreensHeader(value);
    
    case 'Gov-Client-Window-Size':
      return validateWindowSizeHeader(value);
    
    case 'Gov-Client-Browser-JS-User-Agent':
      return encodeHeaderValue(value);
    
    case 'Gov-Client-Browser-Plugins':
      return validatePluginsHeader(value);
    
    case 'Gov-Client-Browser-Do-Not-Track':
      return validateDoNotTrackHeader(value);
    
    case 'Gov-Client-Connection-Method':
      return validateConnectionMethodHeader(value);
    
    case 'Gov-Vendor-Version':
      return validateVendorVersionHeader(value);
    
    case 'Gov-Vendor-License-IDs':
      return encodeHeaderValue(value);
    
    default:
      // For unknown headers, just encode the value
      return encodeHeaderValue(value);
  }
}

/**
 * Validates the Device ID header
 */
function validateDeviceIdHeader(value: string): string {
  // Format: [device-type]=[device-id]
  const regex = /^([A-Za-z]+)=([A-Za-z0-9\-]+)$/;
  
  if (!regex.test(value)) {
    throw new Error('Invalid Device ID format. Expected: [device-type]=[device-id]');
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the User IDs header
 */
function validateUserIdsHeader(value: string): string {
  // Format: os=[user-id]&platform=[user-id]&vendor=[user-id]
  const parts = value.split('&');
  
  if (parts.length === 0) {
    throw new Error('Invalid User IDs format. Expected at least one ID in format: type=[user-id]');
  }
  
  for (const part of parts) {
    const keyValue = part.split('=');
    
    if (keyValue.length !== 2 || !keyValue[0] || !keyValue[1]) {
      throw new Error(`Invalid User ID part: ${part}. Expected format: type=[user-id]`);
    }
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Timezone header
 */
function validateTimezoneHeader(value: string): string {
  // Should be a valid IANA timezone
  // Simple validation: must contain at least one slash
  if (!value.includes('/')) {
    throw new Error('Invalid Timezone format. Expected IANA timezone format (e.g., Europe/London)');
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Local IPs header
 */
function validateLocalIpsHeader(value: string): string {
  // Format: comma-separated list of IP addresses
  const ips = value.split(',');
  
  // Simple IP validation regex (not perfect but good enough for most cases)
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  
  for (const ip of ips) {
    const trimmedIp = ip.trim();
    
    if (!ipRegex.test(trimmedIp)) {
      throw new Error(`Invalid IP address: ${trimmedIp}`);
    }
    
    // Validate each octet is between 0 and 255
    const octets = trimmedIp.split('.').map(Number);
    
    for (const octet of octets) {
      if (octet < 0 || octet > 255) {
        throw new Error(`Invalid IP address octet: ${octet} in ${trimmedIp}`);
      }
    }
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Screens header
 */
function validateScreensHeader(value: string): string {
  // Format: width=NNN&height=NNN&scaling-factor=N.N&colour-depth=N
  const parts = value.split('&');
  const requiredKeys = ['width', 'height', 'scaling-factor', 'colour-depth'];
  const foundKeys: string[] = [];
  
  for (const part of parts) {
    const keyValue = part.split('=');
    
    if (keyValue.length !== 2 || !keyValue[0] || !keyValue[1]) {
      throw new Error(`Invalid Screens part: ${part}`);
    }
    
    const key = keyValue[0];
    const val = keyValue[1];
    
    if (requiredKeys.includes(key)) {
      foundKeys.push(key);
    }
    
    // Validate numeric values
    if (key === 'width' || key === 'height' || key === 'colour-depth') {
      if (!/^\d+$/.test(val)) {
        throw new Error(`Invalid numeric value for ${key}: ${val}`);
      }
    } else if (key === 'scaling-factor') {
      if (!/^\d+(\.\d+)?$/.test(val)) {
        throw new Error(`Invalid decimal value for ${key}: ${val}`);
      }
    }
  }
  
  // Check if all required keys are present
  for (const key of requiredKeys) {
    if (!foundKeys.includes(key)) {
      throw new Error(`Missing required key in Screens header: ${key}`);
    }
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Window Size header
 */
function validateWindowSizeHeader(value: string): string {
  // Format: width=NNN&height=NNN
  const parts = value.split('&');
  const requiredKeys = ['width', 'height'];
  const foundKeys: string[] = [];
  
  for (const part of parts) {
    const keyValue = part.split('=');
    
    if (keyValue.length !== 2 || !keyValue[0] || !keyValue[1]) {
      throw new Error(`Invalid Window Size part: ${part}`);
    }
    
    const key = keyValue[0];
    const val = keyValue[1];
    
    if (requiredKeys.includes(key)) {
      foundKeys.push(key);
    }
    
    // Validate numeric values
    if (!/^\d+$/.test(val)) {
      throw new Error(`Invalid numeric value for ${key}: ${val}`);
    }
  }
  
  // Check if all required keys are present
  for (const key of requiredKeys) {
    if (!foundKeys.includes(key)) {
      throw new Error(`Missing required key in Window Size header: ${key}`);
    }
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Plugins header
 */
function validatePluginsHeader(value: string): string {
  // Format: comma-separated list of plugin names
  if (!value.trim()) {
    throw new Error('Plugins header cannot be empty');
  }
  
  return encodeHeaderValue(value);
}

/**
 * Validates the Do Not Track header
 */
function validateDoNotTrackHeader(value: string): string {
  // Format: "true" or "false"
  if (value !== 'true' && value !== 'false') {
    throw new Error('Invalid Do Not Track value. Expected "true" or "false"');
  }
  
  return value; // No need to encode boolean values
}

/**
 * Validates the Connection Method header
 */
function validateConnectionMethodHeader(value: string): string {
  // Valid connection methods
  const validMethods = [
    'DESKTOP_APP_DIRECT',
    'DESKTOP_APP_VIA_SERVER',
    'MOBILE_APP_DIRECT',
    'MOBILE_APP_VIA_SERVER',
    'BATCH_PROCESS_DIRECT',
    'OTHER_DIRECT',
    'WEB_APP_VIA_SERVER'
  ];
  
  if (!validMethods.includes(value)) {
    throw new Error(`Invalid Connection Method. Expected one of: ${validMethods.join(', ')}`);
  }
  
  return value; // No need to encode enum values
}

/**
 * Validates the Vendor Version header
 */
function validateVendorVersionHeader(value: string): string {
  // Format: [vendor-name]&[product-name]&[product-version]
  const parts = value.split('&');
  
  if (parts.length !== 3) {
    throw new Error('Invalid Vendor Version format. Expected: [vendor-name]&[product-name]&[product-version]');
  }
  
  for (const part of parts) {
    if (!part.trim()) {
      throw new Error('Vendor Version parts cannot be empty');
    }
  }
  
  return encodeHeaderValue(value);
}

/**
 * Encodes a header value to ensure it's properly formatted for HTTP headers
 */
function encodeHeaderValue(value: string): string {
  // Replace any characters that might cause issues in HTTP headers
  // This is a simplified version - in a real implementation, you might want to use
  // a more sophisticated encoding mechanism depending on HMRC's requirements
  return value
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
