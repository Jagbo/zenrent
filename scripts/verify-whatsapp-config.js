#!/usr/bin/env node

/**
 * WhatsApp Configuration Verification Script
 * 
 * This script tests the WhatsApp API configuration to ensure:
 * 1. Environment variables are set correctly
 * 2. API tokens have proper permissions
 * 3. WABA and phone number are accessible
 * 4. Webhook subscriptions are active
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Verification results
const results = {
  envVars: {},
  apiAccess: {},
  wabaDetails: {},
  phoneDetails: {},
  webhookStatus: {}
};

// 1. Check Environment Variables
async function checkEnvironmentVariables() {
  log.section('Environment Variables Check');
  
  const requiredVars = [
    'WHATSAPP_WABA_ID',
    'WHATSAPP_SYSTEM_USER_TOKEN',
    'WHATSAPP_VERIFY_TOKEN',
    'FB_APP_SECRET'
  ];
  
  const optionalVars = [
    'WHATSAPP_API_URL',
    'WHATSAPP_TOKEN'
  ];
  
  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      log.success(`${varName} is set`);
      results.envVars[varName] = true;
      
      // Check for default/unsafe values
      if (varName === 'WHATSAPP_VERIFY_TOKEN' && value === 'your_verify_token') {
        log.warning(`${varName} is using default value - should be changed for production`);
      }
      if (varName === 'FB_APP_SECRET' && value === '76e16d5ea4d3dd0dbb21c41703947995') {
        log.error(`${varName} is using hardcoded value - SECURITY RISK!`);
      }
    } else {
      log.error(`${varName} is NOT set`);
      results.envVars[varName] = false;
    }
  }
  
  // Check optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      log.info(`${varName} is set (optional)`);
    } else {
      log.info(`${varName} is not set (optional)`);
    }
  }
  
  // Check if using default WABA ID
  if (process.env.WHATSAPP_WABA_ID === '596136450071721') {
    log.warning('Using default WABA ID (596136450071721) - verify this is correct');
  }
}

// 2. Test API Access
async function testAPIAccess() {
  log.section('API Access Test');
  
  const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
  if (!token) {
    log.error('Cannot test API access - WHATSAPP_SYSTEM_USER_TOKEN not set');
    return;
  }
  
  try {
    // Test basic API access
    const response = await axios.get(`${GRAPH_API_URL}/me`, {
      params: { access_token: token }
    });
    
    log.success('API token is valid');
    log.info(`Token type: ${response.data.name || 'Unknown'}`);
    results.apiAccess.valid = true;
  } catch (error) {
    log.error(`API token is invalid: ${error.response?.data?.error?.message || error.message}`);
    results.apiAccess.valid = false;
  }
}

// 3. Verify WABA Details
async function verifyWABADetails() {
  log.section('WhatsApp Business Account Verification');
  
  const wabaId = process.env.WHATSAPP_WABA_ID;
  const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
  
  if (!wabaId || !token) {
    log.error('Cannot verify WABA - missing WABA ID or token');
    return;
  }
  
  try {
    // Get WABA details
    const response = await axios.get(`${GRAPH_API_URL}/${wabaId}`, {
      params: {
        access_token: token,
        fields: 'id,name,currency,timezone_id,business_verification_status,message_template_namespace'
      }
    });
    
    const waba = response.data;
    log.success(`WABA accessible: ${waba.name || 'Unnamed'}`);
    log.info(`WABA ID: ${waba.id}`);
    log.info(`Business Verification: ${waba.business_verification_status || 'Unknown'}`);
    log.info(`Currency: ${waba.currency}`);
    log.info(`Timezone: ${waba.timezone_id}`);
    
    results.wabaDetails = waba;
  } catch (error) {
    log.error(`Cannot access WABA: ${error.response?.data?.error?.message || error.message}`);
    results.wabaDetails.error = error.response?.data?.error || error.message;
  }
}

// 4. Verify Phone Numbers
async function verifyPhoneNumbers() {
  log.section('Phone Number Verification');
  
  const wabaId = process.env.WHATSAPP_WABA_ID;
  const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
  
  if (!wabaId || !token) {
    log.error('Cannot verify phone numbers - missing WABA ID or token');
    return;
  }
  
  try {
    // Get phone numbers
    const response = await axios.get(`${GRAPH_API_URL}/${wabaId}/phone_numbers`, {
      params: {
        access_token: token,
        fields: 'id,display_phone_number,verified_name,quality_rating,status,name_status'
      }
    });
    
    const phones = response.data.data || [];
    
    if (phones.length === 0) {
      log.warning('No phone numbers found for this WABA');
    } else {
      log.success(`Found ${phones.length} phone number(s)`);
      
      phones.forEach((phone, index) => {
        console.log(`\n  Phone ${index + 1}:`);
        log.info(`  Number: ${phone.display_phone_number}`);
        log.info(`  ID: ${phone.id}`);
        log.info(`  Name: ${phone.verified_name}`);
        log.info(`  Status: ${phone.status}`);
        log.info(`  Quality: ${phone.quality_rating}`);
        log.info(`  Name Status: ${phone.name_status || 'N/A'}`);
      });
    }
    
    results.phoneDetails = phones;
  } catch (error) {
    log.error(`Cannot access phone numbers: ${error.response?.data?.error?.message || error.message}`);
    results.phoneDetails.error = error.response?.data?.error || error.message;
  }
}

// 5. Check Webhook Subscriptions
async function checkWebhookSubscriptions() {
  log.section('Webhook Subscription Status');
  
  const wabaId = process.env.WHATSAPP_WABA_ID;
  const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
  
  if (!wabaId || !token) {
    log.error('Cannot check webhook subscriptions - missing WABA ID or token');
    return;
  }
  
  try {
    // Check subscribed apps
    const response = await axios.get(`${GRAPH_API_URL}/${wabaId}/subscribed_apps`, {
      params: { access_token: token }
    });
    
    const apps = response.data.data || [];
    
    if (apps.length === 0) {
      log.error('No apps subscribed to this WABA webhooks');
      log.warning('Run the /api/whatsapp/setup endpoint to subscribe');
    } else {
      log.success(`${apps.length} app(s) subscribed to webhooks`);
      apps.forEach((app) => {
        log.info(`App ID: ${app.whatsapp_business_api_data?.id || app.id}`);
        log.info(`Link: ${app.whatsapp_business_api_data?.link || 'N/A'}`);
        log.info(`Name: ${app.whatsapp_business_api_data?.name || 'N/A'}`);
      });
    }
    
    results.webhookStatus = { subscribed: apps.length > 0, apps };
  } catch (error) {
    log.error(`Cannot check webhook subscriptions: ${error.response?.data?.error?.message || error.message}`);
    results.webhookStatus.error = error.response?.data?.error || error.message;
  }
}

// 6. Test sending a message (optional)
async function testSendMessage(testPhoneNumber) {
  log.section('Message Send Test');
  
  if (!testPhoneNumber) {
    log.info('Skipping message send test - no test number provided');
    return;
  }
  
  const token = process.env.WHATSAPP_SYSTEM_USER_TOKEN;
  const phones = results.phoneDetails;
  
  if (!token || !phones || phones.length === 0) {
    log.error('Cannot test message sending - missing token or no phone numbers');
    return;
  }
  
  const phoneId = phones[0].id;
  
  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: testPhoneNumber,
        type: 'text',
        text: {
          body: 'Test message from ZenRent WhatsApp verification script'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log.success(`Test message sent successfully! Message ID: ${response.data.messages[0].id}`);
  } catch (error) {
    log.error(`Failed to send test message: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Generate summary report
function generateSummary() {
  log.section('Verification Summary');
  
  // Environment Variables
  const envVarCount = Object.keys(results.envVars).length;
  const envVarsSet = Object.values(results.envVars).filter(v => v).length;
  console.log(`Environment Variables: ${envVarsSet}/${envVarCount} set`);
  
  // API Access
  if (results.apiAccess.valid) {
    console.log(`API Access: ${colors.green}✓ Valid${colors.reset}`);
  } else {
    console.log(`API Access: ${colors.red}✗ Invalid${colors.reset}`);
  }
  
  // WABA Status
  if (results.wabaDetails.id) {
    console.log(`WABA Status: ${colors.green}✓ Accessible${colors.reset}`);
  } else {
    console.log(`WABA Status: ${colors.red}✗ Not accessible${colors.reset}`);
  }
  
  // Phone Numbers
  const phoneCount = results.phoneDetails.length || 0;
  if (phoneCount > 0) {
    console.log(`Phone Numbers: ${colors.green}✓ ${phoneCount} found${colors.reset}`);
  } else {
    console.log(`Phone Numbers: ${colors.red}✗ None found${colors.reset}`);
  }
  
  // Webhooks
  if (results.webhookStatus.subscribed) {
    console.log(`Webhook Status: ${colors.green}✓ Subscribed${colors.reset}`);
  } else {
    console.log(`Webhook Status: ${colors.red}✗ Not subscribed${colors.reset}`);
  }
  
  // Overall status
  console.log('\n' + colors.cyan + '='.repeat(50) + colors.reset);
  
  const allGood = envVarsSet === envVarCount && 
                  results.apiAccess.valid && 
                  results.wabaDetails.id && 
                  phoneCount > 0 && 
                  results.webhookStatus.subscribed;
  
  if (allGood) {
    log.success('All checks passed! WhatsApp integration is properly configured.');
  } else {
    log.error('Some checks failed. Please review the issues above.');
  }
}

// Main execution
async function main() {
  console.log(colors.cyan + '=' + colors.reset + ' WhatsApp Configuration Verification ' + colors.cyan + '=' + colors.reset);
  console.log('This script will verify your WhatsApp API configuration\n');
  
  try {
    await checkEnvironmentVariables();
    await testAPIAccess();
    await verifyWABADetails();
    await verifyPhoneNumbers();
    await checkWebhookSubscriptions();
    
    // Optional: Test sending a message
    // Pass a phone number as argument to test: node verify-whatsapp-config.js 447911123456
    const testNumber = process.argv[2];
    if (testNumber) {
      await testSendMessage(testNumber);
    }
    
    generateSummary();
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
  }
}

// Run the verification
main(); 