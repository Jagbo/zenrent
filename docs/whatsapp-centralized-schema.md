# WhatsApp Centralized Model - Database Schema Design

## Overview

This document outlines the database schema changes required to support ZenRent's centralized WhatsApp Business Account (WABA) model, where all tenant communications pass through a single ZenRent-controlled WhatsApp number.

## Current State Analysis

### Existing Tables (Multi-WABA Model)

1. **`whatsapp_accounts`** - Stores individual landlord WABA connections
   - `user_id` → landlord
   - `waba_id` → landlord's individual WABA
   - `phone_number_id` → landlord's individual phone
   - Status: **DEPRECATED** in centralized model

2. **`whatsapp_messages`** - Stores message history
   - `user_id` → landlord
   - `waba_id` → landlord's individual WABA
   - `from_phone` / `to_phone` → message routing
   - Status: **NEEDS MODIFICATION** for centralized model

3. **`tenants`** - Tenant information
   - `user_id` → landlord (property owner)
   - `phone` → tenant's phone number (KEY for routing)
   - Status: **USED AS-IS** for routing logic

4. **`leases`** - Tenant-property relationships
   - `tenant_id` → links to tenant
   - `property_id` → links to property
   - Status: **USED AS-IS** for routing logic

## New Schema Design

### Option 1: User Profile Field (Recommended)

Add WhatsApp opt-in directly to existing `user_profiles` table:

```sql
-- Add WhatsApp opt-in field to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN whatsapp_opted_in_at TIMESTAMPTZ,
ADD COLUMN whatsapp_notifications_enabled BOOLEAN DEFAULT TRUE;
```

**Advantages:**
- Simple implementation
- Leverages existing user management
- Easy to query with user data

### Option 2: Dedicated Settings Table (Alternative)

Create a separate table for WhatsApp settings:

```sql
-- Create dedicated WhatsApp settings table
CREATE TABLE landlord_whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  opted_in_at TIMESTAMPTZ,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  message_signature TEXT, -- Optional custom signature
  auto_responses JSONB, -- Future: automated responses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Advantages:**
- More flexible for future features
- Isolated WhatsApp-specific logic
- Easier to extend with complex settings

## Modified Message Storage

### Updated `whatsapp_messages` Table

Since we're using a centralized WABA, modify the message structure:

```sql
-- Migration to update whatsapp_messages for centralized model
ALTER TABLE whatsapp_messages 
-- Change from multiple WABAs to single WABA
DROP COLUMN waba_id, -- Remove (using ZenRent's single WABA)
ADD COLUMN landlord_id UUID REFERENCES auth.users(id), -- Add explicit landlord reference
ADD COLUMN tenant_id UUID REFERENCES tenants(id), -- Add tenant reference for easier queries
ADD COLUMN property_id UUID REFERENCES properties(id), -- Add property context

-- Update indexes for new query patterns
CREATE INDEX whatsapp_messages_landlord_tenant_idx ON whatsapp_messages(landlord_id, tenant_id);
CREATE INDEX whatsapp_messages_tenant_phone_idx ON whatsapp_messages(tenant_phone);
```

### Message Routing Fields

```sql
-- Add fields for message routing and attribution
ALTER TABLE whatsapp_messages
ADD COLUMN conversation_id UUID, -- Group related messages
ADD COLUMN is_from_tenant BOOLEAN DEFAULT TRUE, -- Direction clarity
ADD COLUMN landlord_signature TEXT, -- Store the "From [Landlord] via ZenRent:" prefix
ADD COLUMN routing_status TEXT DEFAULT 'delivered', -- delivered, failed, unknown_sender
ADD COLUMN routing_metadata JSONB; -- Store routing decision info
```

## Message Routing Logic Schema

### Conversation Tracking

```sql
-- Create conversations table for better message organization
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tenant_phone TEXT NOT NULL,
  property_id UUID REFERENCES properties(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active, archived, blocked
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(landlord_id, tenant_phone)
);

-- Index for fast lookup during webhook routing
CREATE INDEX whatsapp_conversations_tenant_phone_idx ON whatsapp_conversations(tenant_phone);
```

## Tenant-Landlord Routing View

Create a materialized view for fast message routing:

```sql
-- Create view for efficient tenant-to-landlord routing
CREATE MATERIALIZED VIEW tenant_landlord_routing AS
SELECT 
  t.phone AS tenant_phone,
  t.id AS tenant_id,
  t.name AS tenant_name,
  t.user_id AS landlord_id,
  p.id AS property_id,
  p.address AS property_address,
  l.id AS lease_id,
  l.status AS lease_status,
  up.whatsapp_enabled AS landlord_whatsapp_enabled,
  up.full_name AS landlord_name
FROM tenants t
JOIN leases l ON t.id = l.tenant_id 
JOIN properties p ON l.property_id = p.id
JOIN user_profiles up ON t.user_id = up.id
WHERE l.status = 'active'
  AND t.phone IS NOT NULL 
  AND t.phone != '';

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_tenant_landlord_routing()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW tenant_landlord_routing;
END;
$$ LANGUAGE plpgsql;

-- Index for fast phone number lookups
CREATE UNIQUE INDEX tenant_landlord_routing_phone_idx 
ON tenant_landlord_routing(tenant_phone);
```

## Migration Strategy

### Phase 1: Add Opt-In Mechanism
1. Add `whatsapp_enabled` to `user_profiles`
2. Create API endpoints for opt-in/opt-out
3. Update UI to show opt-in toggle

### Phase 2: Modify Message Storage  
1. Add new fields to `whatsapp_messages`
2. Create `whatsapp_conversations` table
3. Create routing materialized view
4. Update webhook to use new routing logic

### Phase 3: Clean Up (Future)
1. Deprecate `whatsapp_accounts` table
2. Remove unused WABA-specific fields
3. Archive old multi-WABA messages

## Data Migration Considerations

### Existing WhatsApp Messages
```sql
-- Migrate existing messages to new schema
UPDATE whatsapp_messages 
SET landlord_id = user_id,
    tenant_id = (
      SELECT t.id FROM tenants t 
      WHERE t.phone = whatsapp_messages.from_phone 
      AND t.user_id = whatsapp_messages.user_id
      LIMIT 1
    ),
    is_from_tenant = (direction = 'incoming');
```

### Existing WhatsApp Accounts
```sql
-- Mark existing WhatsApp accounts as migrated
UPDATE whatsapp_accounts 
SET status = 'migrated_to_centralized'
WHERE status = 'connected';
```

## Performance Considerations

1. **Tenant Phone Lookup**: Index on `tenants.phone` for fast routing
2. **Message History**: Partition `whatsapp_messages` by date if volume grows
3. **Routing View**: Refresh materialized view on tenant/lease changes
4. **Conversation Caching**: Consider Redis for active conversation state

## Security & RLS Policies

```sql
-- Update RLS policies for new schema
CREATE POLICY "Landlords can view their tenant conversations"
ON whatsapp_conversations FOR SELECT
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can view their WhatsApp messages"  
ON whatsapp_messages FOR SELECT
USING (landlord_id = auth.uid() OR user_id = auth.uid());

-- Ensure tenant privacy - landlords can only see their own tenant messages
CREATE POLICY "Prevent cross-landlord message access"
ON whatsapp_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenants t 
    WHERE t.phone = whatsapp_messages.from_phone 
    AND t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);
```

## Recommended Implementation

**Use Option 1 (User Profile Field)** for simplicity:

1. Add `whatsapp_enabled` to `user_profiles`
2. Create the routing materialized view
3. Add conversation tracking
4. Implement new message storage logic
5. Create efficient indexes for routing

This approach minimizes schema complexity while providing all necessary functionality for the centralized WhatsApp model.

---

**Next Steps:**
1. Implement the chosen schema in a migration
2. Create API endpoints for opt-in management  
3. Update webhook routing logic
4. Test with sample data 