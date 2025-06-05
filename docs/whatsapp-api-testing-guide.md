# WhatsApp Opt-In API Testing Guide

## Overview

This guide covers testing the new WhatsApp centralized opt-in API endpoints created for Task 2.

## Prerequisites

1. ✅ Database migration `20250101000000_whatsapp_centralized_opt_in.sql` applied
2. ✅ User authenticated and has user profile
3. ✅ (Optional) User has tenants for full functionality testing

## API Endpoints

### 1. GET /api/whatsapp/opt-in-status

**Purpose:** Check current WhatsApp opt-in status for authenticated landlord

**Headers Required:**
```
Cookie: sb-[project-id]-auth-token=[session-token]
```

**Response Example:**
```json
{
  "whatsapp_enabled": false,
  "whatsapp_opted_in_at": null,
  "whatsapp_notifications_enabled": false,
  "landlord_id": "123e4567-e89b-12d3-a456-426614174000",
  "landlord_name": "John Smith",
  "tenant_count": 3,
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "Jane Doe",
      "phone": "07700900123",
      "email": "jane@example.com",
      "property_address": "123 Main St",
      "lease_status": "active"
    }
  ],
  "system_configured": true,
  "status_message": "WhatsApp messaging is disabled",
  "can_receive_messages": false,
  "needs_tenants": false,
  "can_enable": true
}
```

### 2. POST /api/whatsapp/toggle-opt-in

**Purpose:** Enable or disable WhatsApp messaging for authenticated landlord

**Headers Required:**
```
Cookie: sb-[project-id]-auth-token=[session-token]
Content-Type: application/json
```

**Request Body:**
```json
{
  "enabled": true
}
```

**Response Example (Success):**
```json
{
  "success": true,
  "whatsapp_enabled": true,
  "whatsapp_opted_in_at": "2024-01-01T12:00:00.000Z",
  "whatsapp_notifications_enabled": true,
  "landlord_name": "John Smith",
  "tenant_count": 3,
  "message": "WhatsApp messaging enabled! You can now receive messages from 3 tenant(s)."
}
```

## Testing Scenarios

### Scenario 1: First-Time Opt-In

1. **Check initial status:**
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/opt-in-status \
     -H "Cookie: sb-[project]-auth-token=[token]"
   ```
   
   Expected: `whatsapp_enabled: false`

2. **Enable WhatsApp:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/toggle-opt-in \
     -H "Cookie: sb-[project]-auth-token=[token]" \
     -H "Content-Type: application/json" \
     -d '{"enabled": true}'
   ```
   
   Expected: `success: true, whatsapp_enabled: true, whatsapp_opted_in_at: [timestamp]`

3. **Verify status updated:**
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/opt-in-status \
     -H "Cookie: sb-[project]-auth-token=[token]"
   ```
   
   Expected: `whatsapp_enabled: true, can_receive_messages: true` (if has tenants)

### Scenario 2: Opt-Out

1. **Disable WhatsApp:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/toggle-opt-in \
     -H "Cookie: sb-[project]-auth-token=[token]" \
     -H "Content-Type: application/json" \
     -d '{"enabled": false}'
   ```
   
   Expected: `success: true, whatsapp_enabled: false`

2. **Verify status updated:**
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/opt-in-status \
     -H "Cookie: sb-[project]-auth-token=[token]"
   ```
   
   Expected: `whatsapp_enabled: false, can_receive_messages: false`

### Scenario 3: Error Handling

1. **Invalid request body:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/toggle-opt-in \
     -H "Cookie: sb-[project]-auth-token=[token]" \
     -H "Content-Type: application/json" \
     -d '{"enabled": "yes"}'
   ```
   
   Expected: `400 Bad Request - enabled must be a boolean`

2. **Unauthenticated request:**
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/opt-in-status
   ```
   
   Expected: `401 Unauthorized`

3. **Wrong HTTP method:**
   ```bash
   curl -X PUT http://localhost:3000/api/whatsapp/opt-in-status
   ```
   
   Expected: `405 Method not allowed`

## Browser Testing

### Using Developer Tools

1. **Open browser to:** `http://localhost:3000/settings/whatsapp`
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Test status check:**
   ```javascript
   fetch('/api/whatsapp/opt-in-status')
     .then(r => r.json())
     .then(console.log)
   ```

5. **Test opt-in:**
   ```javascript
   fetch('/api/whatsapp/toggle-opt-in', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ enabled: true })
   })
   .then(r => r.json())
   .then(console.log)
   ```

## Database Verification

### Check Migration Applied
```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'whatsapp%';

-- Expected: 3 rows (whatsapp_enabled, whatsapp_opted_in_at, whatsapp_notifications_enabled)
```

### Check Routing View
```sql
-- Verify routing view exists and has data
SELECT COUNT(*) FROM tenant_landlord_routing;

-- Check specific tenant phone lookup
SELECT * FROM tenant_landlord_routing 
WHERE tenant_phone = '07700900123';
```

### Check Functions
```sql
-- Test routing function
SELECT * FROM get_landlord_by_tenant_phone('07700900123');

-- Test tenant listing function
SELECT * FROM get_landlord_tenants_for_whatsapp('your-user-id-here');
```

## Common Issues & Solutions

### Issue: "Column does not exist"
**Solution:** Run the migration: 
```bash
npx supabase db push
```

### Issue: "Function does not exist"
**Solution:** Ensure migration completed successfully, check Supabase logs

### Issue: "No tenants returned"
**Solution:** 
1. Check user has tenants with phone numbers
2. Verify leases are active
3. Check tenant phone format (not empty/null)

### Issue: "401 Unauthorized"
**Solution:**
1. Ensure user is logged in
2. Check session cookie is being sent
3. Verify Supabase auth is working

## Expected Test Results

**With Tenants:**
- `tenant_count` > 0
- `can_receive_messages` = true when enabled
- `needs_tenants` = false

**Without Tenants:**
- `tenant_count` = 0  
- `can_receive_messages` = false
- `needs_tenants` = true when enabled

**System Status:**
- `system_configured` = true if env vars set
- `can_enable` = true if system configured

## Next Steps After Testing

Once these APIs are working:
1. ✅ **Task 2 Complete** - Landlord opt-in backend ready
2. 🔄 **Move to Task 3** - Update WhatsApp settings UI
3. 🔄 **Move to Task 4** - Refactor message sending logic
4. 🔄 **Move to Task 5** - Implement webhook routing

---

**Testing Checklist:**
- [ ] GET /api/whatsapp/opt-in-status returns correct structure
- [ ] POST /api/whatsapp/toggle-opt-in successfully enables WhatsApp
- [ ] POST /api/whatsapp/toggle-opt-in successfully disables WhatsApp
- [ ] Database updates correctly on opt-in changes
- [ ] Tenant count shows accurately
- [ ] Error handling works for invalid requests
- [ ] Authentication required for all endpoints 