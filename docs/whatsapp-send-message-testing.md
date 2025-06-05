# WhatsApp Centralized Send Message API Testing Guide

## Overview

This guide covers testing the refactored `/api/whatsapp/send-message` endpoint that now uses ZenRent's centralized WhatsApp Business Account instead of individual landlord WABAs.

## Prerequisites

✅ **Database Migration Applied**: `whatsapp_centralized_opt_in_fixed`  
✅ **Landlord Opted In**: Landlord has `whatsapp_enabled = true`  
✅ **Active Tenants**: Landlord has tenants with valid phone numbers  
✅ **Environment Configured**: Central WABA and phone number ID set  

## API Changes Summary

### Before (Multi-WABA Model)
```json
{
  "phoneNumberId": "landlord_specific_phone_id",
  "to": "447911123456", 
  "message": "Hello tenant!",
  "messageType": "text"
}
```

### After (Centralized Model)
```json
{
  "to": "447911123456",
  "message": "Hello tenant!",
  "messageType": "text"
}
```

**Key Changes:**
- ❌ **Removed**: `phoneNumberId` parameter (uses central phone)
- ✅ **Added**: Automatic landlord attribution to messages
- ✅ **Added**: Tenant-landlord relationship verification
- ✅ **Added**: WhatsApp opt-in status checking

## Test Scenarios

### 1. Successful Message Send ✅

**Setup:**
- Landlord: James Agbodo (`fd98eb7b-e2a1-488b-a669-d34c914202b1`)
- WhatsApp enabled: `true`
- Tenant: Emma Clarke (`07700 900789`)

**Request:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-njsmkqmhkhxemxoqnvmc-auth-token=YOUR_SESSION_TOKEN" \
  -d '{
    "to": "07700900789",
    "message": "Your rent is due tomorrow. Please let me know if you need any assistance.",
    "messageType": "text"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "07700900789",
      "wa_id": "07700900789"
    }
  ],
  "messages": [
    {
      "id": "mock_msg_1704067200000"
    }
  ]
}
```

**Expected Message Attribution:**
```
*From James Agbodo (via ZenRent):*

Your rent is due tomorrow. Please let me know if you need any assistance.
```

**Expected Database Log:**
- Message logged in `whatsapp_messages_centralized` table
- Original message and attributed message both stored
- Direction: `outgoing`, Status: `sent`

### 2. Unauthorized Access ❌

**Request:** (No authentication cookie)
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{"to": "07700900789", "message": "Test"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 3. WhatsApp Not Enabled ❌

**Setup:** Landlord with `whatsapp_enabled = false`

**Expected Response:**
```json
{
  "success": false,
  "error": "WhatsApp messaging is not enabled for your account"
}
```

### 4. Invalid Tenant Phone ❌

**Request:** Phone number not belonging to landlord's tenants
```json
{
  "to": "447911999999",
  "message": "Test message"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Recipient is not one of your tenants"
}
```

### 5. Missing Required Fields ❌

**Request:**
```json
{
  "message": "Missing recipient phone"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Recipient phone number and message are required"
}
```

### 6. Invalid Phone Format ❌

**Request:**
```json
{
  "to": "+44-791-1123456",
  "message": "Test with invalid format"
}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Recipient phone number should only contain digits (E.164 format without +)"
}
```

## Development Testing Features

### Mock API Logging

In development mode, the API provides detailed logging:

```
[DEV] Sending WhatsApp message:
  From: James Agbodo (via ZenRent central number: 1234567890)
  To: Emma Clarke (07700900789)
  Type: text
  Message: *From James Agbodo (via ZenRent):*

Your rent is due tomorrow. Please let me know if you need any assistance.
```

### Database Verification

Check message logging:
```sql
SELECT 
  landlord_id,
  tenant_name,
  tenant_phone,
  message_content,
  attributed_message,
  direction,
  status,
  timestamp
FROM whatsapp_messages_centralized 
ORDER BY timestamp DESC 
LIMIT 5;
```

## Production Testing

### Environment Check

1. **Verify Central Configuration:**
```bash
curl http://localhost:3000/api/env-check
# Should show WHATSAPP_PHONE_NUMBER_ID configured
```

2. **Check Database Functions:**
```sql
-- Test tenant routing
SELECT * FROM get_landlord_by_tenant_phone('07700900789');

-- Test tenant listing  
SELECT * FROM get_landlord_tenants_for_whatsapp('fd98eb7b-e2a1-488b-a669-d34c914202b1');
```

### Message Attribution Testing

**Test Different Name Combinations:**

1. **Full Name**: `first_name: "James", last_name: "Agbodo"`
   → Attribution: `*From James Agbodo (via ZenRent):*`

2. **First Name Only**: `first_name: "James", last_name: null`
   → Attribution: `*From James (via ZenRent):*`

3. **Last Name Only**: `first_name: null, last_name: "Agbodo"`
   → Attribution: `*From Agbodo (via ZenRent):*`

4. **No Name**: `first_name: null, last_name: null`
   → Attribution: `*From Your Landlord (via ZenRent):*`

## Security Testing

### Multi-Tenant Isolation

1. **Create Second Landlord** with different tenants
2. **Attempt Cross-Tenant Messaging**: Landlord A tries to message Landlord B's tenant
3. **Expected Result**: `403 Forbidden - Recipient is not one of your tenants`

### Authorization Edge Cases

1. **Expired Sessions**: Old authentication tokens
2. **Missing User Profiles**: User without profile record  
3. **Database Connection Issues**: Simulated DB failures

## Performance Testing

### Message Volume

Test sending multiple messages rapidly:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/whatsapp/send-message \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-njsmkqmhkhxemxoqnvmc-auth-token=TOKEN" \
    -d "{\"to\": \"07700900789\", \"message\": \"Test message $i\"}" &
done
wait
```

### Database Performance

Monitor query performance for:
- Tenant routing lookups
- Message logging inserts  
- User profile fetches

## Troubleshooting

### Common Issues

1. **"Authentication error"**
   - Check session token validity
   - Verify Supabase client configuration

2. **"Failed to verify recipient"**
   - Check tenant phone number format
   - Verify tenant-landlord relationships in database

3. **"WhatsApp integration is not configured"**
   - Verify `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_SYSTEM_USER_TOKEN`
   - Check environment variable loading

### Debug Database State

```sql
-- Check user profile
SELECT user_id, first_name, last_name, whatsapp_enabled 
FROM user_profiles 
WHERE user_id = 'fd98eb7b-e2a1-488b-a669-d34c914202b1';

-- Check tenant routing
SELECT * FROM tenant_landlord_routing;

-- Check recent messages
SELECT * FROM whatsapp_messages_centralized 
ORDER BY timestamp DESC LIMIT 10;
```

## Success Criteria

✅ **Authentication**: Only authenticated landlords can send messages  
✅ **Authorization**: Landlords can only message their own tenants  
✅ **Attribution**: All messages include landlord name  
✅ **Logging**: Messages are logged to centralized table  
✅ **Validation**: Input validation prevents malformed requests  
✅ **Error Handling**: Clear error messages for all failure cases  
✅ **Multi-Tenant**: Complete isolation between landlords  

---

**Next Step**: Test webhook routing for incoming messages (Task 5) 