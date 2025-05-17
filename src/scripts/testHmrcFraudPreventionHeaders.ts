/**
 * HMRC Fraud Prevention Headers Test Script
 * 
 * This script tests the generation, validation, and encoding of HMRC fraud prevention headers.
 * It simulates different browser environments and validates that the headers meet HMRC's requirements.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/testHmrcFraudPreventionHeaders.ts
 */

import { createClient } from '@supabase/supabase-js';
import { FraudPreventionHeaderService } from '../lib/services/hmrc/fraudPrevention/fraudPreventionHeaderService';
import { validateAndEncodeHeaders } from '../lib/services/hmrc/fraudPrevention/headerValidator';
import { ClientData, ConnectionMethod, FraudPreventionHeaders } from '../lib/services/hmrc/fraudPrevention/types';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user ID - replace with a real user ID from your database
const TEST_USER_ID = process.env.TEST_USER_ID || '';

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log('=== HMRC Fraud Prevention Headers Test ===');
    
    if (!TEST_USER_ID) {
      console.error('Error: TEST_USER_ID not set in environment variables');
      console.log('Please set TEST_USER_ID in .env.local to a valid user ID');
      process.exit(1);
    }
    
    // Get the fraud prevention header service
    const headerService = FraudPreventionHeaderService.getInstance();
    
    // Test 1: Generate headers from stored client data
    console.log('\nTest 1: Generating headers from stored client data...');
    const storedHeaders = await headerService.generateHeaders(TEST_USER_ID);
    
    if (storedHeaders) {
      console.log('✅ Successfully generated headers from stored client data');
      console.log('Generated headers:');
      printHeaders(storedHeaders);
      
      // Validate the headers
      const validation = headerService.validateHeaders(storedHeaders);
      
      if (validation.valid) {
        console.log('✅ All headers are valid');
      } else {
        console.error('❌ Header validation failed');
        if (validation.missing.length > 0) {
          console.error('Missing required headers:', validation.missing);
        }
        if (validation.errors.length > 0) {
          console.error('Header format errors:', validation.errors);
        }
      }
    } else {
      console.error('❌ Failed to generate headers from stored client data');
      console.log('Generating mock client data for testing...');
      
      // Test 2: Generate headers from mock client data
      console.log('\nTest 2: Generating headers from mock client data...');
      const mockClientData = generateMockClientData();
      const mockHeaders = await headerService.generateHeaders(TEST_USER_ID, mockClientData);
      
      if (mockHeaders) {
        console.log('✅ Successfully generated headers from mock client data');
        console.log('Generated headers:');
        printHeaders(mockHeaders);
        
        // Validate the headers
        const validation = headerService.validateHeaders(mockHeaders);
        
        if (validation.valid) {
          console.log('✅ All headers are valid');
        } else {
          console.error('❌ Header validation failed');
          if (validation.missing.length > 0) {
            console.error('Missing required headers:', validation.missing);
          }
          if (validation.errors.length > 0) {
            console.error('Header format errors:', validation.errors);
          }
        }
      } else {
        console.error('❌ Failed to generate headers from mock client data');
      }
    }
    
    // Test 3: Test header validation with invalid headers
    console.log('\nTest 3: Testing header validation with invalid headers...');
    const invalidHeaders = generateInvalidHeaders();
    
    console.log('Invalid headers:');
    printHeaders(invalidHeaders);
    
    // Validate the headers
    const invalidValidation = headerService.validateHeaders(invalidHeaders);
    
    if (!invalidValidation.valid) {
      console.log('✅ Invalid headers correctly identified');
      if (invalidValidation.missing.length > 0) {
        console.log('Missing required headers:', invalidValidation.missing);
      }
      if (invalidValidation.errors.length > 0) {
        console.log('Header format errors:', invalidValidation.errors);
      }
    } else {
      console.error('❌ Invalid headers incorrectly validated as valid');
    }
    
    // Test 4: Test header encoding
    console.log('\nTest 4: Testing header encoding...');
    const headersToEncode = generateHeadersWithSpecialChars();
    
    console.log('Headers with special characters:');
    printHeaders(headersToEncode);
    
    // Encode the headers
    const { headers: encodedHeaders, validation: encodingValidation } = validateAndEncodeHeaders(headersToEncode);
    
    console.log('Encoded headers:');
    printHeaders(encodedHeaders);
    
    if (encodingValidation.valid) {
      console.log('✅ Headers successfully encoded');
    } else {
      console.error('❌ Header encoding validation failed');
      console.error('Encoding errors:', encodingValidation.errors);
    }
    
    // Test 5: Test cross-browser compatibility
    console.log('\nTest 5: Testing cross-browser compatibility...');
    
    // Simulate different browsers
    const browsers = [
      { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      { name: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0' },
      { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15' },
      { name: 'Edge', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59' }
    ];
    
    for (const browser of browsers) {
      console.log(`\nTesting with ${browser.name}...`);
      
      // Generate mock client data for this browser
      const browserClientData = generateMockClientData(browser.userAgent);
      const browserHeaders = await headerService.generateHeaders(TEST_USER_ID, browserClientData);
      
      if (browserHeaders) {
        console.log(`✅ Successfully generated headers for ${browser.name}`);
        
        // Validate the headers
        const browserValidation = headerService.validateHeaders(browserHeaders);
        
        if (browserValidation.valid) {
          console.log(`✅ All headers are valid for ${browser.name}`);
        } else {
          console.error(`❌ Header validation failed for ${browser.name}`);
          if (browserValidation.missing.length > 0) {
            console.error('Missing required headers:', browserValidation.missing);
          }
          if (browserValidation.errors.length > 0) {
            console.error('Header format errors:', browserValidation.errors);
          }
        }
      } else {
        console.error(`❌ Failed to generate headers for ${browser.name}`);
      }
    }
    
    console.log('\n=== Test Summary ===');
    console.log('All tests completed');
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

/**
 * Print headers in a readable format
 */
function printHeaders(headers: FraudPreventionHeaders) {
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      console.log(`${key}: ${value}`);
    }
  }
}

/**
 * Generate mock client data for testing
 */
function generateMockClientData(userAgent?: string): ClientData {
  return {
    browser: {
      userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      plugins: [
        { name: 'PDF Viewer' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Chromium PDF Viewer' }
      ],
      doNotTrack: false,
      windowSize: {
        width: 1920,
        height: 1080
      },
      timezone: 'Europe/London',
      screenInfo: {
        width: 1920,
        height: 1080,
        scalingFactor: 1.0,
        colorDepth: 24
      },
      localIps: ['192.168.1.1', '10.0.0.1']
    },
    device: {
      deviceId: uuidv4(),
      deviceType: 'Browser'
    },
    connectionMethod: ConnectionMethod.WEB_APP_VIA_SERVER,
    vendor: {
      name: 'ZenRent',
      productName: 'TaxModule',
      productVersion: '1.0.0',
      licenseIds: ['LICENSE-123']
    }
  };
}

/**
 * Generate invalid headers for testing
 */
function generateInvalidHeaders(): FraudPreventionHeaders {
  return {
    'Gov-Client-Device-ID': 'Invalid-Format',
    'Gov-Client-User-IDs': 'invalid=format',
    'Gov-Client-Timezone': 'InvalidTimezone',
    'Gov-Client-Local-IPs': '999.999.999.999',
    'Gov-Client-Screens': 'invalid-format',
    'Gov-Client-Window-Size': 'invalid-format',
    'Gov-Client-Browser-JS-User-Agent': 'Test User Agent',
    'Gov-Client-Browser-Plugins': '',
    'Gov-Client-Browser-Do-Not-Track': 'invalid',
    'Gov-Client-Connection-Method': 'INVALID_METHOD',
    'Gov-Vendor-Version': 'invalid-format',
    'Gov-Vendor-License-IDs': 'LICENSE-123'
  };
}

/**
 * Generate headers with special characters for testing encoding
 */
function generateHeadersWithSpecialChars(): FraudPreventionHeaders {
  return {
    'Gov-Client-Device-ID': 'Browser=b41894d8-abf9-4b2f-a3d6-594f2af93b4d',
    'Gov-Client-User-IDs': 'os=john.doe&platform=123456&vendor=ABC123',
    'Gov-Client-Timezone': 'Europe/London',
    'Gov-Client-Local-IPs': '192.168.1.1,10.0.0.1',
    'Gov-Client-Screens': 'width=1920&height=1080&scaling-factor=1.0&colour-depth=24',
    'Gov-Client-Window-Size': 'width=1920&height=1080',
    'Gov-Client-Browser-JS-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36\nWith\tSpecial\rCharacters',
    'Gov-Client-Browser-Plugins': 'PDF Viewer, Chrome PDF Viewer, Chromium PDF Viewer, Microsoft Edge PDF Viewer, WebKit built-in PDF',
    'Gov-Client-Browser-Do-Not-Track': 'false',
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Vendor-Version': 'ZenRent&TaxModule&1.0.0',
    'Gov-Vendor-License-IDs': 'LICENSE-123, LICENSE-456'
  };
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nTests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
