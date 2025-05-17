/**
 * Types for HMRC Fraud Prevention Headers
 * 
 * This file contains type definitions for the data needed to generate
 * HMRC fraud prevention headers.
 */

/**
 * Connection method as defined by HMRC
 */
export enum ConnectionMethod {
  DESKTOP_APP_DIRECT = 'DESKTOP_APP_DIRECT',
  DESKTOP_APP_VIA_SERVER = 'DESKTOP_APP_VIA_SERVER',
  MOBILE_APP_DIRECT = 'MOBILE_APP_DIRECT',
  MOBILE_APP_VIA_SERVER = 'MOBILE_APP_VIA_SERVER',
  BATCH_PROCESS_DIRECT = 'BATCH_PROCESS_DIRECT',
  OTHER_DIRECT = 'OTHER_DIRECT',
  WEB_APP_VIA_SERVER = 'WEB_APP_VIA_SERVER'
}

/**
 * Screen information
 */
export interface ScreenInfo {
  width: number;
  height: number;
  scalingFactor: number;
  colorDepth: number;
}

/**
 * Window size information
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Browser plugin information
 */
export interface BrowserPlugin {
  name: string;
  description?: string;
}

/**
 * Client-side browser data
 */
export interface BrowserData {
  userAgent: string;
  plugins: BrowserPlugin[];
  doNotTrack: boolean;
  windowSize: WindowSize;
  timezone: string;
  screenInfo: ScreenInfo;
  localIps?: string[];
}

/**
 * User identification data
 */
export interface UserData {
  userId: string;
  osUserId?: string;
  platformUserId?: string;
  vendorUserId?: string;
}

/**
 * Vendor software information
 */
export interface VendorInfo {
  name: string;
  productName: string;
  productVersion: string;
  licenseIds?: string[];
}

/**
 * Device identification data
 */
export interface DeviceData {
  deviceId: string;
  deviceType: 'Browser' | 'Mobile' | 'Desktop' | 'Server' | 'Other';
}

/**
 * Complete client data for fraud prevention headers
 */
export interface ClientData {
  browser: BrowserData;
  device: DeviceData;
  connectionMethod: ConnectionMethod;
  vendor: VendorInfo;
}

/**
 * Fraud prevention headers
 */
export interface FraudPreventionHeaders {
  'Gov-Client-Device-ID': string;
  'Gov-Client-User-IDs': string;
  'Gov-Client-Timezone': string;
  'Gov-Client-Local-IPs'?: string;
  'Gov-Client-Screens'?: string;
  'Gov-Client-Window-Size'?: string;
  'Gov-Client-Browser-JS-User-Agent'?: string;
  'Gov-Client-Browser-Plugins'?: string;
  'Gov-Client-Browser-Do-Not-Track'?: string;
  'Gov-Client-Connection-Method': string;
  'Gov-Vendor-Version': string;
  'Gov-Vendor-License-IDs'?: string;
}
