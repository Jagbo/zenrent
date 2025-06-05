# WhatsApp Infrastructure Verification Guide

## Overview

This guide walks through the verification process for ZenRent's centralized WhatsApp Business Account (WABA) infrastructure. Complete all steps before proceeding with the WhatsApp integration refactor.

## Prerequisites

1. Access to Meta Business Manager
2. Access to Meta Developer Portal  
3. Access to ZenRent's environment configuration
4. Node.js installed for running verification scripts

## Step 1: Meta Business & App Setup

### 1.1 Verify WhatsApp Business Account

1. Log into [Meta Business Manager](https://business.facebook.com)
2. Navigate to **Business Settings** > **Accounts** > **WhatsApp Business Accounts**
3. Verify ZenRent has a WABA created and note:
   - WABA ID
   - Business verification status
   - Associated phone numbers

### 1.2 Verify Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Select ZenRent's app
3. Verify:
   - WhatsApp Business Platform product is added
   - App is business verified
   - Required permissions are granted

### 1.3 Configure Webhook

1. In your Meta App dashboard, go to **WhatsApp** > **Configuration**
2. Set the Webhook URL: `https://[your-domain]/api/whatsapp/webhook`
3. Set the Verify Token (must match `WHATSAPP_VERIFY_TOKEN` in your env)
4. Subscribe to webhook fields:
   - `messages`
   - `message_status` (optional)
   - `message_reactions` (optional)

## Step 2: System User Setup

### 2.1 Create System User

1. In Meta Business Manager, go to **Business Settings** > **Users** > **System Users**
2. Click **Add** to create a new system user
3. Name it (e.g., "ZenRent WhatsApp Integration")
4. Set role to **Admin**

### 2.2 Assign Permissions

1. Click on the system user
2. Click **Add Assets**
3. Select **WhatsApp Accounts**
4. Choose ZenRent's WABA
5. Grant **Full Control**

### 2.3 Generate Token

1. Click **Generate New Token**
2. Select ZenRent's app
3. Add permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`  
   - `business_management` (if available)
4. Generate and save the token securely

## Step 3: Environment Configuration

### 3.1 Set Environment Variables

Copy the required variables from `docs/whatsapp-env-example.txt` to your `.env.local`:

```bash
# Required
WHATSAPP_WABA_ID=<your-waba-id>
WHATSAPP_SYSTEM_USER_TOKEN=<your-system-user-token>
WHATSAPP_VERIFY_TOKEN=<your-verify-token>
FB_APP_SECRET=<your-app-secret>
NEXT_PUBLIC_FB_APP_ID=<your-app-id>
```

### 3.2 Security Checklist

- [ ] Removed hardcoded `FB_APP_SECRET` from `next.config.js` ✅ (Already done)
- [ ] All tokens are stored in environment variables only
- [ ] `.env*` files are in `.gitignore`
- [ ] Production uses secure secret management (e.g., Vercel env vars)

## Step 4: Run Verification Script

### 4.1 Install Dependencies

```bash
cd scripts
npm install axios dotenv
```

### 4.2 Run Verification

```bash
node verify-whatsapp-config.js
```

This will check:
- Environment variables
- API token validity
- WABA accessibility
- Phone numbers
- Webhook subscriptions

### 4.3 Test Message (Optional)

To test sending a message:

```bash
node verify-whatsapp-config.js <test-phone-number>
# Example: node verify-whatsapp-config.js 447911123456
```

## Step 5: Complete Checklist

Use the checklist in `docs/whatsapp-infrastructure-checklist.md` to ensure all items are verified.

## Common Issues & Solutions

### Issue: "API token is invalid"
**Solution:** Regenerate the system user token with correct permissions

### Issue: "No apps subscribed to WABA webhooks"  
**Solution:** Call the `/api/whatsapp/setup` endpoint while authenticated to subscribe

### Issue: "Cannot access WABA"
**Solution:** Verify the system user has admin access to the WABA

### Issue: Webhook not receiving events
**Solution:** 
1. Verify webhook URL is correct in Meta App dashboard
2. Check verify token matches
3. Ensure webhook endpoint is publicly accessible

## Next Steps

Once all verification passes:

1. Document the actual production values (securely)
2. Create backup of credentials
3. Proceed to Task 2: Landlord Opt-In Feature

## Security Reminders

- **Never** commit secrets to version control
- **Never** expose `FB_APP_SECRET` in client-side code
- Use strong, random values for `WHATSAPP_VERIFY_TOKEN`
- Rotate tokens periodically
- Monitor API usage for anomalies

## Support

For issues with:
- Meta/Facebook setup: Consult [WhatsApp Business API docs](https://developers.facebook.com/docs/whatsapp)
- ZenRent implementation: Check internal documentation or contact the dev team

---

Last Updated: [Current Date] 