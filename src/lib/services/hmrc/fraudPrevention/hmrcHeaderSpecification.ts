/**
 * HMRC Fraud Prevention Headers Specification
 * 
 * This file contains the specification for the fraud prevention headers required by HMRC APIs.
 * Based on HMRC's documentation: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/
 * 
 * These headers are mandatory for all API calls to HMRC and help prevent fraud.
 */

/**
 * Header categories based on HMRC's classification
 */
export enum HeaderCategory {
  ORIGINATING_DEVICE = 'Originating Device',
  ORIGINATING_USER = 'Originating User',
  VENDOR_SOFTWARE = 'Vendor Software',
  CONNECTION_METHOD = 'Connection Method',
  WEB_BROWSER = 'Web Browser'
}

/**
 * Header requirement level
 */
export enum HeaderRequirement {
  REQUIRED = 'required',
  REQUIRED_IF_AVAILABLE = 'required_if_available',
  OPTIONAL = 'optional'
}

/**
 * Header specification interface
 */
export interface HeaderSpecification {
  name: string;
  category: HeaderCategory;
  requirement: HeaderRequirement;
  description: string;
  format: string;
  example: string;
}

/**
 * Complete specification of all HMRC fraud prevention headers
 */
export const HMRC_FRAUD_PREVENTION_HEADERS: HeaderSpecification[] = [
  // Originating Device Headers
  {
    name: 'Gov-Client-Device-ID',
    category: HeaderCategory.ORIGINATING_DEVICE,
    requirement: HeaderRequirement.REQUIRED,
    description: 'A unique identifier for the device originating the request',
    format: 'String with format: [device-type]=[device-id]',
    example: 'Gov-Client-Device-ID: Browser=b41894d8-abf9-4b2f-a3d6-594f2af93b4d'
  },
  {
    name: 'Gov-Client-User-IDs',
    category: HeaderCategory.ORIGINATING_USER,
    requirement: HeaderRequirement.REQUIRED,
    description: 'Identifiers for the end-user accessing the service',
    format: 'String with format: os=[user-id]&platform=[user-id]&vendor=[user-id]',
    example: 'Gov-Client-User-IDs: os=john.doe&platform=123456&vendor=ABC123'
  },
  {
    name: 'Gov-Client-Timezone',
    category: HeaderCategory.ORIGINATING_DEVICE,
    requirement: HeaderRequirement.REQUIRED,
    description: 'The local timezone of the originating device',
    format: 'String in IANA Time Zone Database format',
    example: 'Gov-Client-Timezone: Europe/London'
  },
  {
    name: 'Gov-Client-Local-IPs',
    category: HeaderCategory.ORIGINATING_DEVICE,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'The IP addresses of the originating device',
    format: 'Comma-separated list of IP addresses',
    example: 'Gov-Client-Local-IPs: 10.1.2.3,192.168.0.1'
  },
  {
    name: 'Gov-Client-Screens',
    category: HeaderCategory.ORIGINATING_DEVICE,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'Details about the screens of the originating device',
    format: 'Comma-separated list with format: width=NNN&height=NNN&scaling-factor=N.N&colour-depth=N',
    example: 'Gov-Client-Screens: width=1920&height=1080&scaling-factor=1.0&colour-depth=24'
  },
  
  // Connection Method Headers
  {
    name: 'Gov-Client-Connection-Method',
    category: HeaderCategory.CONNECTION_METHOD,
    requirement: HeaderRequirement.REQUIRED,
    description: 'The connection method used by the originating device',
    format: 'String with one of: "DESKTOP_APP_DIRECT", "DESKTOP_APP_VIA_SERVER", "MOBILE_APP_DIRECT", "MOBILE_APP_VIA_SERVER", "BATCH_PROCESS_DIRECT", "OTHER_DIRECT", "WEB_APP_VIA_SERVER"',
    example: 'Gov-Client-Connection-Method: WEB_APP_VIA_SERVER'
  },
  
  // Web Browser Headers
  {
    name: 'Gov-Client-Browser-JS-User-Agent',
    category: HeaderCategory.WEB_BROWSER,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'The user agent string from the browser JavaScript',
    format: 'String containing the user agent',
    example: 'Gov-Client-Browser-JS-User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    name: 'Gov-Client-Browser-Plugins',
    category: HeaderCategory.WEB_BROWSER,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'The plugins installed in the browser',
    format: 'Comma-separated list of plugin names',
    example: 'Gov-Client-Browser-Plugins: PDF Viewer,Chrome PDF Viewer'
  },
  {
    name: 'Gov-Client-Browser-Do-Not-Track',
    category: HeaderCategory.WEB_BROWSER,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'The Do Not Track setting from the browser',
    format: 'String with value "true" or "false"',
    example: 'Gov-Client-Browser-Do-Not-Track: false'
  },
  {
    name: 'Gov-Client-Window-Size',
    category: HeaderCategory.WEB_BROWSER,
    requirement: HeaderRequirement.REQUIRED_IF_AVAILABLE,
    description: 'The window size of the browser',
    format: 'String with format: width=NNN&height=NNN',
    example: 'Gov-Client-Window-Size: width=1280&height=720'
  },
  
  // Vendor Software Headers
  {
    name: 'Gov-Vendor-Version',
    category: HeaderCategory.VENDOR_SOFTWARE,
    requirement: HeaderRequirement.REQUIRED,
    description: 'Information about the software making the API call',
    format: 'String with format: [vendor-name]&[product-name]&[product-version]',
    example: 'Gov-Vendor-Version: ZenRent&TaxModule&1.0.0'
  },
  {
    name: 'Gov-Vendor-License-IDs',
    category: HeaderCategory.VENDOR_SOFTWARE,
    requirement: HeaderRequirement.OPTIONAL,
    description: 'License identifiers for the software',
    format: 'String with format: [vendor-license-id]',
    example: 'Gov-Vendor-License-IDs: ABC123456'
  }
];

/**
 * Get header specifications by category
 */
export function getHeadersByCategory(category: HeaderCategory): HeaderSpecification[] {
  return HMRC_FRAUD_PREVENTION_HEADERS.filter(header => header.category === category);
}

/**
 * Get header specifications by requirement level
 */
export function getHeadersByRequirement(requirement: HeaderRequirement): HeaderSpecification[] {
  return HMRC_FRAUD_PREVENTION_HEADERS.filter(header => header.requirement === requirement);
}

/**
 * Get header specification by name
 */
export function getHeaderByName(name: string): HeaderSpecification | undefined {
  return HMRC_FRAUD_PREVENTION_HEADERS.find(header => header.name === name);
}

/**
 * Get all required headers
 */
export function getRequiredHeaders(): HeaderSpecification[] {
  return HMRC_FRAUD_PREVENTION_HEADERS.filter(
    header => header.requirement === HeaderRequirement.REQUIRED
  );
}

/**
 * Get all conditionally required headers (required if available)
 */
export function getConditionallyRequiredHeaders(): HeaderSpecification[] {
  return HMRC_FRAUD_PREVENTION_HEADERS.filter(
    header => header.requirement === HeaderRequirement.REQUIRED_IF_AVAILABLE
  );
}
