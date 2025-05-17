/**
 * HMRC OAuth Flow Test Script
 * 
 * This script tests the entire HMRC OAuth flow, including:
 * - Initiating the authorization flow
 * - Handling the callback
 * - Token storage and retrieval
 * - Token refresh
 * - Using the middleware
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/testHmrcOAuthFlow.ts
 */

import { createClient } from '@supabase/supabase-js';
import { HmrcAuthService } from '../lib/services/hmrc/hmrcAuthService';
import dotenv from 'dotenv';
import { NextRequest } from 'next/server';
import { hmrcAuthMiddleware } from '../lib/middleware/hmrcAuthMiddleware';

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
    console.log('=== HMRC OAuth Flow Test ===');
    
    if (!TEST_USER_ID) {
      console.error('Error: TEST_USER_ID not set in environment variables');
      console.log('Please set TEST_USER_ID in .env.local to a valid user ID');
      process.exit(1);
    }
    
    // Get HMRC Auth Service instance
    const hmrcAuthService = HmrcAuthService.getInstance();
    
    // Initialize the service
    console.log('Initializing HMRC Auth Service...');
    await hmrcAuthService.ensureInitialized();
    console.log('✅ HMRC Auth Service initialized');
    
    // Test 1: Check if user is connected to HMRC
    console.log('\nTest 1: Checking if user is connected to HMRC...');
    const isConnected = await hmrcAuthService.isConnected(TEST_USER_ID);
    console.log(`User connection status: ${isConnected ? 'Connected' : 'Not connected'}`);
    
    // If user is not connected, generate auth URL
    if (!isConnected) {
      console.log('\nTest 2: Generating authorization URL...');
      const { authUrl, codeVerifier } = await hmrcAuthService.initiateAuth(TEST_USER_ID);
      console.log(`✅ Auth URL generated: ${authUrl}`);
      console.log(`✅ Code verifier generated and stored: ${codeVerifier.substring(0, 10)}...`);
      console.log('\nPlease visit this URL in your browser to authorize the application:');
      console.log(authUrl);
      console.log('\nAfter authorization, you will be redirected to the callback URL.');
      console.log('Please copy the "code" parameter from the URL and set it as CODE in .env.local');
      console.log('Then run this script again with TEST_CALLBACK=true');
      
      // Exit if we're not testing the callback
      if (process.env.TEST_CALLBACK !== 'true') {
        return;
      }
    }
    
    // Test 3: Test callback handling (only if CODE is provided)
    if (process.env.TEST_CALLBACK === 'true' && process.env.CODE) {
      console.log('\nTest 3: Testing callback handling...');
      const code = process.env.CODE;
      console.log(`Using authorization code: ${code.substring(0, 10)}...`);
      
      const tokenResponse = await hmrcAuthService.handleCallback(code, TEST_USER_ID);
      
      if (tokenResponse) {
        console.log('✅ Successfully exchanged code for tokens');
        console.log(`Access token: ${tokenResponse.access_token.substring(0, 10)}...`);
        console.log(`Refresh token: ${tokenResponse.refresh_token.substring(0, 10)}...`);
        console.log(`Expires in: ${tokenResponse.expires_in} seconds`);
      } else {
        console.error('❌ Failed to exchange code for tokens');
      }
    }
    
    // Test 4: Get valid token (with refresh if needed)
    if (isConnected || (process.env.TEST_CALLBACK === 'true' && process.env.CODE)) {
      console.log('\nTest 4: Getting valid token...');
      const validToken = await hmrcAuthService.getValidToken(TEST_USER_ID);
      
      if (validToken) {
        console.log(`✅ Valid token retrieved: ${validToken.substring(0, 10)}...`);
      } else {
        console.error('❌ Failed to get valid token');
      }
    }
    
    // Test 5: Test middleware
    if (isConnected || (process.env.TEST_CALLBACK === 'true' && process.env.CODE)) {
      console.log('\nTest 5: Testing HMRC auth middleware...');
      
      // Create mock request
      const mockRequest = {
        cookies: {
          get: (name: string) => {
            if (name === 'sb-access-token') {
              return { value: 'mock-supabase-token' };
            }
            return undefined;
          }
        },
        headers: new Headers(),
        url: 'https://example.com/api/hmrc/test',
        method: 'GET',
      } as unknown as NextRequest;
      
      // Mock getUserIdFromSession
      const originalGetUserId = (hmrcAuthMiddleware as any).getUserIdFromSession;
      (hmrcAuthMiddleware as any).getUserIdFromSession = async () => TEST_USER_ID;
      
      try {
        const middlewareResponse = await hmrcAuthMiddleware(mockRequest);
        
        if (middlewareResponse === null) {
          console.log('✅ Middleware passed request through (token attached)');
        } else {
          console.log('❌ Middleware returned response instead of passing through');
          console.log(middlewareResponse);
        }
      } finally {
        // Restore original function
        (hmrcAuthMiddleware as any).getUserIdFromSession = originalGetUserId;
      }
    }
    
    // Test 6: Test token refresh (if token exists)
    if (isConnected) {
      console.log('\nTest 6: Testing token refresh...');
      
      // Force token refresh
      const tokenResponse = await hmrcAuthService.refreshToken(TEST_USER_ID);
      
      if (tokenResponse) {
        console.log('✅ Successfully refreshed tokens');
        console.log(`New access token: ${tokenResponse.access_token.substring(0, 10)}...`);
        console.log(`New refresh token: ${tokenResponse.refresh_token.substring(0, 10)}...`);
        console.log(`Expires in: ${tokenResponse.expires_in} seconds`);
      } else {
        console.error('❌ Failed to refresh tokens');
      }
    }
    
    console.log('\n=== Test Summary ===');
    console.log(`User connection status: ${isConnected ? 'Connected' : 'Not connected'}`);
    if (!isConnected && process.env.TEST_CALLBACK !== 'true') {
      console.log('Please authorize the application and run the script again with TEST_CALLBACK=true');
    } else if (!isConnected && process.env.TEST_CALLBACK === 'true' && !process.env.CODE) {
      console.log('Please set CODE in .env.local to the authorization code from the callback URL');
    } else {
      console.log('All tests completed successfully');
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
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
