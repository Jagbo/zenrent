# WhatsApp Infrastructure Verification Checklist

## Overview
This document serves as a verification checklist for ZenRent's centralized WhatsApp Business Account (WABA) infrastructure. All items must be verified before proceeding with the centralized WhatsApp integration implementation.

## Current Status
- **Date:** [TO BE FILLED]
- **Verified By:** [TO BE FILLED]
- **Environment:** [dev/staging/production]

## 1. Meta Business & WhatsApp Configuration

### 1.1 ZenRent WABA Setup
- [ ] **WABA Created:** ZenRent has its own WhatsApp Business Account
  - WABA ID: `___________________` (Currently using: `596136450071721`)
  - Business Name: `___________________`
  - Status: `___________________`

- [ ] **Phone Number Acquired:** ZenRent has a dedicated WhatsApp phone number
  - Phone Number: `___________________`
  - Phone Number ID: `___________________`
  - Display Name: `___________________`
  - Quality Rating: `___________________`
  - Status: `___________________`

### 1.2 Meta App Configuration
- [ ] **App Created:** Meta Developer App exists for ZenRent
  - App ID: `___________________`
  - App Name: `___________________`
  - Business Verification Status: `___________________`

- [ ] **WhatsApp Product Added:** WhatsApp Business Platform product is enabled
- [ ] **Permissions Granted:**
  - [ ] `whatsapp_business_messaging`
  - [ ] `whatsapp_business_management`
  - [ ] `business_management` (if needed)

## 2. Environment Variables

### 2.1 Required Variables
Check that these environment variables are set in all environments:

- [ ] **WHATSAPP_WABA_ID**
  - Current Default: `596136450071721`
  - Production Value: `___________________`
  - Verified in: [ ] Dev [ ] Staging [ ] Production

- [ ] **WHATSAPP_SYSTEM_USER_TOKEN**
  - Token Type: System User Token (long-lived)
  - Permissions: WhatsApp Business Messaging, Management
  - Expiry: `___________________` (should be non-expiring for system user)
  - Verified in: [ ] Dev [ ] Staging [ ] Production

- [ ] **WHATSAPP_VERIFY_TOKEN**
  - Current Default: `your_verify_token` / `zenrent5512429`
  - Production Value: `___________________`
  - Matches Meta App Dashboard: [ ] Yes [ ] No
  - Verified in: [ ] Dev [ ] Staging [ ] Production

- [ ] **FB_APP_SECRET**
  - ⚠️ **SECURITY ISSUE:** Currently hardcoded in `next.config.js` as `76e16d5ea4d3dd0dbb21c41703947995`
  - [ ] Remove from `next.config.js`
  - [ ] Set as environment variable only
  - Production Value: `___________________`
  - Verified in: [ ] Dev [ ] Staging [ ] Production

### 2.2 Optional Variables
- [ ] **WHATSAPP_API_URL** (if using custom API endpoint)
  - Default: `https://graph.facebook.com/v18.0`
  - Custom Value: `___________________`

- [ ] **WHATSAPP_TOKEN** (used in register-phone route - may be deprecated)
  - Current Usage: `src/app/api/whatsapp/register-phone/route.ts`
  - Status: [ ] Active [ ] Deprecated

## 3. Webhook Configuration

### 3.1 Meta App Dashboard Settings
- [ ] **Webhook URL Configured:**
  - URL: `https://[YOUR_DOMAIN]/api/whatsapp/webhook`
  - Actual URL: `___________________`

- [ ] **Webhook Subscriptions:**
  - [ ] `messages` - For incoming messages and status updates
  - [ ] `message_reactions` (optional)
  - [ ] `message_templates_status_update` (if using templates)

- [ ] **Webhook Verification:**
  - Verify Token matches `WHATSAPP_VERIFY_TOKEN`: [ ] Yes [ ] No
  - Webhook verified successfully: [ ] Yes [ ] No

### 3.2 Webhook Security
- [ ] **Signature Verification Enabled:**
  - `FB_APP_SECRET` is set and used for signature verification
  - Code in `src/app/api/whatsapp/webhook/route.ts` validates signatures

## 4. System User Configuration

### 4.1 System User Setup (in Meta Business Manager)
- [ ] **System User Created:**
  - System User Name: `___________________`
  - System User ID: `___________________`
  
- [ ] **Permissions Assigned:**
  - [ ] WhatsApp Business Management
  - [ ] WhatsApp Business Messaging
  - [ ] Access to ZenRent's WABA

- [ ] **Token Generated:**
  - [ ] Token is non-expiring (system user token)
  - [ ] Token has required permissions
  - [ ] Token tested with Graph API

## 5. Database Schema Verification

### 5.1 Current Tables (from migration `20240515000000_create_whatsapp_tables.sql`)
- [ ] **whatsapp_accounts table exists**
  - Note: Currently designed for multi-WABA model
  - Will need modification for centralized model

- [ ] **whatsapp_messages table exists**
  - Note: Message routing logic will need update

### 5.2 Required Schema Changes for Centralized Model
- [ ] Plan created for schema modifications
- [ ] Migration scripts prepared

## 6. Code Issues to Address

### 6.1 Security Issues
- [ ] **Remove hardcoded secrets:**
  - [ ] `FB_APP_SECRET` in `next.config.js`
  - [ ] Default tokens in code

### 6.2 Configuration Issues
- [ ] **Consistent token naming:**
  - Multiple verify token defaults: `your_verify_token`, `zenrent5512429`, `zenrent_webhook_verify_token`
  - Standardize to one value

### 6.3 Code Dependencies
- [ ] **Routes using WhatsApp:**
  - `/api/whatsapp/setup` - Currently fetches ZenRent WABA phones
  - `/api/whatsapp/send-message` - Sends messages
  - `/api/whatsapp/webhook` - Receives messages
  - `/api/whatsapp/connect` - May be deprecated
  - `/api/whatsapp/register-phone` - May be deprecated
  - `/api/whatsapp/messages` - Message retrieval

## 7. Testing Requirements

### 7.1 API Testing
- [ ] **Graph API Access:**
  - [ ] Can fetch WABA details
  - [ ] Can fetch phone number details
  - [ ] Can send test message
  - [ ] Can subscribe app to webhooks

### 7.2 Webhook Testing
- [ ] **Webhook Receives Events:**
  - [ ] Verification challenge successful
  - [ ] Test message received
  - [ ] Status updates received

## 8. Production Readiness

### 8.1 Rate Limits & Tiers
- [ ] **Current WhatsApp Tier:** `___________________`
- [ ] **Daily Message Limit:** `___________________`
- [ ] **Rate Limit Strategy:** Implemented/Planned

### 8.2 Monitoring & Logging
- [ ] **Error Logging:** Configured for WhatsApp API errors
- [ ] **Webhook Event Logging:** Enabled
- [ ] **Message Success/Failure Tracking:** Implemented

## Action Items

### Immediate Actions Required:
1. **CRITICAL:** Remove hardcoded `FB_APP_SECRET` from `next.config.js`
2. **CRITICAL:** Verify all environment variables are set correctly
3. **IMPORTANT:** Confirm webhook is properly configured in Meta App Dashboard
4. **IMPORTANT:** Test system user token permissions

### Next Steps:
1. Complete all verification items above
2. Document actual values for production
3. Create backup/recovery plan for credentials
4. Plan database schema modifications for centralized model

## Notes
[Add any additional notes or observations here]

## 📡 API Endpoints

### Core Endpoints (Centralized Model)
- `/api/whatsapp/toggle-opt-in` - Enable/disable WhatsApp for landlord
- `/api/whatsapp/opt-in-status` - Check landlord's opt-in status
- `/api/whatsapp/send-message` - Send messages via central number
- `/api/whatsapp/messages` - Get/send messages for conversations
- `/api/whatsapp/webhook` - Receive incoming messages and status updates

### Removed Legacy Endpoints
The following endpoints from the multi-WABA model have been removed:
- `/api/whatsapp/setup` - Was for fetching individual WABA phones
- `/api/whatsapp/connect` - Was for individual WABA connections
- `/api/whatsapp/register-phone` - Was for phone registration
- `/integrations/whatsapp-success` - Was for post-connection success page

---
**Last Updated:** [Date]
**Next Review:** [Date] 