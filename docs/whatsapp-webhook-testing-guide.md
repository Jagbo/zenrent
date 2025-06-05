# WhatsApp Centralized Webhook Testing Guide

## Overview

This guide covers testing the refactored WhatsApp webhook that routes incoming messages to landlords based on tenant phone numbers in the centralized model.

## Prerequisites

✅ **Database Migration Applied**: `create_centralized_messages_table`  
✅ **Landlord Opted In**: At least one landlord with `whatsapp_enabled = true`  
✅ **Active Tenants**: Landlord has tenants with valid phone numbers  
✅ **Routing View**: `tenant_landlord_routing` populated  
✅ **Environment Variables**: Webhook verification token configured  

## Environment Setup

```bash
# Required environment variables
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_here
FB_APP_SECRET=your_facebook_app_secret
WHATSAPP_WABA_ID=your_central_waba_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing Webhook Verification (GET)

### Test 1: Valid Verification
```bash
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_secure_verify_token_here&hub.challenge=test123"
```

**Expected Response:**
```
test123
```

### Test 2: Invalid Token
```bash
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test123"
```

**Expected Response:**
```
Verification failed
```

## Testing Incoming Messages (POST)

### Test 3: Valid Incoming Message

**Payload (incoming_message_test.json):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "596136450071721",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "your_phone_number_id",
              "display_phone_number": "+44xxxxxxxxx"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test Tenant"
                },
                "wa_id": "447700900789"
              }
            ],
            "messages": [
              {
                "from": "447700900789",
                "id": "wamid.test123456",
                "timestamp": "1704067200",
                "text": {
                  "body": "Hello, I have a maintenance issue!"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test_signature" \
  -d @incoming_message_test.json
```

**Expected Database Entry:**
```sql
SELECT 
  whatsapp_message_id,
  direction,
  from_phone,
  message_body,
  landlord_id,
  tenant_name,
  routing_failure_reason
FROM whatsapp_messages_centralized 
WHERE whatsapp_message_id = 'wamid.test123456';
```

### Test 4: Unroutable Message (Unknown Tenant)

**Payload with unknown phone:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "596136450071721", 
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "your_phone_number_id",
              "display_phone_number": "+44xxxxxxxxx"
            },
            "messages": [
              {
                "from": "447999888777",
                "id": "wamid.unroutable123",
                "timestamp": "1704067200",
                "text": {
                  "body": "Message from unknown tenant"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Expected Result:**
- Message stored with `landlord_id = NULL`
- `routing_failure_reason` set to "No landlord found for phone..."
- Console warning logged for admin attention

### Test 5: Status Update

**Payload for delivery receipt:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "596136450071721",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "your_phone_number_id"
            },
            "statuses": [
              {
                "id": "wamid.existing_message_id",
                "status": "delivered",
                "timestamp": "1704067260",
                "recipient_id": "447700900789"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Expected Result:**
- Existing message updated with `status = 'delivered'`
- `delivered_at` timestamp set

## Database Verification Queries

### Check Routing Functionality
```sql
-- Verify tenant-landlord routing
SELECT * FROM tenant_landlord_routing 
WHERE tenant_phone = '07700 900789';

-- Check message storage
SELECT 
  id,
  whatsapp_message_id,
  direction,
  from_phone,
  message_body,
  landlord_id,
  tenant_name,
  routing_failure_reason,
  created_at
FROM whatsapp_messages_centralized 
ORDER BY created_at DESC 
LIMIT 5;

-- Check unrouted messages (admin attention needed)
SELECT 
  from_phone,
  message_body,
  routing_failure_reason,
  created_at
FROM whatsapp_messages_centralized 
WHERE routing_failure_reason IS NOT NULL
ORDER BY created_at DESC;
```

### Check Message Status Updates
```sql
-- Verify status tracking
SELECT 
  whatsapp_message_id,
  status,
  timestamp,
  delivered_at,
  read_at
FROM whatsapp_messages_centralized 
WHERE status != 'received'
ORDER BY timestamp DESC;
```

## Phone Number Normalization Testing

### Test Phone Number Formats
```javascript
// Test the normalizePhoneNumber function with various formats
const testNumbers = [
  '447700900789',    // Should become '07700 900789'
  '+447700900789',   // Should become '07700 900789'
  '07700 900789',    // Should stay '07700 900789'
  '07700900789',     // Should become '07700 900789'
  '0770090 0789',    // Should become '07700 900789'
];
```

## Error Scenarios

### Test 6: Invalid Webhook Format
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"invalid": "format"}'
```

**Expected:** 200 OK (graceful handling)

### Test 7: Missing Signature (if enabled)
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d @incoming_message_test.json
```

**Expected:** 401 or warning in logs

## Production Checklist

- [ ] FB_APP_SECRET properly configured
- [ ] Webhook URL registered in Meta App dashboard
- [ ] Signature verification enabled
- [ ] Central WABA subscribed to app
- [ ] Phone number permissions verified
- [ ] Routing view populated with real tenant data
- [ ] Admin monitoring set up for unrouted messages
- [ ] Load testing completed

## Troubleshooting

### Common Issues

1. **"No landlord found"**: Verify tenant phone numbers in routing view
2. **Signature verification failed**: Check FB_APP_SECRET configuration
3. **Database foreign key errors**: Ensure user_profiles table populated
4. **Phone normalization issues**: Check UK number format handling

### Debug Queries
```sql
-- Check if routing view is populated
SELECT COUNT(*) FROM tenant_landlord_routing;

-- Check landlord opt-in status
SELECT user_id, whatsapp_enabled FROM user_profiles 
WHERE whatsapp_enabled = true;

-- Check tenant phone formats
SELECT DISTINCT phone FROM tenants 
WHERE phone IS NOT NULL;
``` 