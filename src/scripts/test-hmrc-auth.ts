/**
 * Test script for HMRC Authentication flow
 * 
 * This script tests the HMRC authentication flow by:
 * 1. Generating an auth URL
 * 2. Checking code verifier storage
 * 3. Simulating a token retrieval
 * 
 * Usage:
 * ts-node scripts/test-hmrc-auth.ts
 */

import { HmrcAuthService } from '../lib/services/hmrc/hmrcAuthService';
import { TokenStorageService } from '../lib/services/security/tokenStorageService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testHmrcAuth() {
  console.log('🔍 Testing HMRC Authentication Flow');
  console.log('----------------------------------');

  try {
    // Initialize auth service
    const hmrcAuthService = HmrcAuthService.getInstance();
    await hmrcAuthService.ensureInitialized();
    console.log('✅ HmrcAuthService initialized successfully');

    // Test user ID - this would normally come from the authenticated user
    const testUserId = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000';
    console.log(`🧪 Using test user ID: ${testUserId}`);

    // Step 1: Generate auth URL and store code verifier
    console.log('\n📡 Step 1: Generating auth URL...');
    const authResult = await hmrcAuthService.initiateAuth(testUserId);
    console.log(`✅ Auth URL generated: ${authResult.authUrl.substring(0, 60)}...`);
    console.log(`✅ Code verifier generated and stored: ${authResult.codeVerifier.substring(0, 10)}...`);

    // Step 2: Verify code verifier storage
    console.log('\n🔐 Step 2: Verifying code verifier storage...');
    
    // Create state parameter similar to what would be in the callback
    const stateObj = {
      userId: testUserId,
      random: Math.random().toString(36).substring(2, 12),
      timestamp: Date.now()
    };
    const stateStr = JSON.stringify(stateObj);
    const stateBase64 = Buffer.from(stateStr).toString('base64');
    
    // Get the stored code verifier
    const storedVerifier = await hmrcAuthService.getCodeVerifier(stateBase64);
    
    if (storedVerifier) {
      console.log(`✅ Retrieved code verifier: ${storedVerifier.substring(0, 10)}...`);
      console.log(`✅ Code verifier matches: ${storedVerifier === authResult.codeVerifier}`);
    } else {
      console.log('❌ Failed to retrieve code verifier');
    }

    // Step 3: Test token storage
    console.log('\n💾 Step 3: Testing token storage...');
    const tokenStorageService = TokenStorageService.getInstance();
    
    // Mock token data
    const mockTokenData = {
      access_token: 'test_access_token_' + Date.now(),
      refresh_token: 'test_refresh_token_' + Date.now(),
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read:self-assessment'
    };
    
    // Store tokens
    await hmrcAuthService.storeTokens(testUserId, mockTokenData);
    console.log('✅ Mock tokens stored successfully');
    
    // Verify token storage
    const storedToken = await tokenStorageService.getToken(testUserId, 'hmrc');
    
    if (storedToken) {
      console.log('✅ Retrieved stored token successfully');
      console.log(`✅ Token access_token: ${storedToken.access_token.substring(0, 10)}...`);
      console.log(`✅ Token refresh_token: ${storedToken.refresh_token?.substring(0, 10)}...`);
    } else {
      console.log('❌ Failed to retrieve stored token');
    }

    // Step 4: Test connection status
    console.log('\n🔌 Step 4: Testing connection status...');
    const isConnected = await hmrcAuthService.isConnected(testUserId);
    console.log(`✅ Connection status: ${isConnected ? 'Connected' : 'Not connected'}`);

    console.log('\n🎉 HMRC Authentication Flow Test Completed');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testHmrcAuth().catch(console.error);
