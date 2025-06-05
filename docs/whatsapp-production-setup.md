# WhatsApp Production Setup Guide

## Issue Identified
Your WhatsApp Business Account is currently in **Development Mode**, which means it can only send messages to pre-approved phone numbers. This is why you're getting the error:

```
(#131030) Recipient phone number not in allowed list
```

## Solutions

### Option 1: Add Test Phone Numbers (Quick Fix)
For immediate testing, you can add specific phone numbers to your allowed list:

1. Go to **Meta Business Manager** → **WhatsApp Manager**
2. Find your WhatsApp Business Account: `596136450071721`
3. Go to **Phone Numbers** → **564943553373191**
4. Click **Configure** → **Recipients**
5. Add the phone numbers you want to test with (format: +447123456789)
6. Save the changes

### Option 2: Move to Production Mode (Recommended)
To send messages to any phone number, you need to move to production mode:

#### Prerequisites for Production:
1. **Business Verification**: Your business must be verified with Meta
2. **App Review**: Your app needs to go through Meta's app review process
3. **WhatsApp Business Profile**: Must be complete with business information
4. **Terms Acceptance**: Accept WhatsApp Business API terms

#### Steps to Go Live:
1. **Complete Business Verification**:
   - Go to Meta Business Manager → Business Settings → Business Info
   - Complete business verification if not already done
   - Upload required business documents

2. **Submit App for Review**:
   - Go to Facebook Developer Console → Your App → App Review
   - Submit for `whatsapp_business_messaging` advanced access
   - Provide detailed use case explanation
   - Include screenshots of your integration

3. **Configure WhatsApp Business Profile**:
   - Add business logo, description, and contact information
   - Set up business hours and location (if applicable)
   - Complete all required profile fields

4. **Request Production Access**:
   - Go to WhatsApp Manager → Phone Numbers
   - Select your phone number: `564943553373191`
   - Click "Request Production Access"
   - Fill out the required forms

#### Timeline:
- Business verification: 1-3 business days
- App review: 3-7 business days
- Production access: 1-2 business days after app approval

## Current Status Check

To check your current status:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://graph.facebook.com/v18.0/596136450071721?fields=name,status,timezone_id"
```

Look for the `status` field:
- `PENDING` = Development mode
- `APPROVED` = Production ready

## Temporary Workaround

For immediate testing, you can:

1. **Use your own phone number** for testing
2. **Add team members' phone numbers** to the allowed list
3. **Use WhatsApp Business Sandbox** numbers (if available)

## Testing with Allowed Numbers

Once you add phone numbers to the allowed list, test with this command:

```bash
node scripts/test-send-message.js
```

Update the phone number in the script to match one you've added to the allowed list.

## Next Steps

1. **Immediate**: Add your phone number to the allowed list for testing
2. **Short-term**: Complete business verification
3. **Medium-term**: Submit app for review
4. **Long-term**: Move to full production mode

## Important Notes

- **Rate Limits**: Development mode has lower rate limits
- **Message Types**: Only text messages and approved templates work in development
- **Analytics**: Limited analytics available in development mode
- **Webhooks**: Work the same in both development and production

## Contact Meta Support

If you need help with the production approval process:
- WhatsApp Business Platform Support
- Meta Business Help Center
- Facebook Developer Community Forums 