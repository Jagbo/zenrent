# PostHog Analytics Setup for ZenRent

This document explains how to set up and use PostHog analytics in the ZenRent application.

## Installation

PostHog Node.js SDK has been installed:

```bash
npm install posthog-node --save
```

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```env
# PostHog Configuration
POSTHOG_API_KEY=phc_1vnwbI0NJez98xBTvnJrE7UvPsj4uVMynMfbcejp9Zd
POSTHOG_HOST=https://eu.i.posthog.com
```

> **Note**: The API key above is the one provided in your request. In production, ensure this is kept secure and consider using different keys for different environments.

## Architecture Overview

The PostHog integration consists of several key components:

### 1. Core Service (`src/lib/services/posthog.ts`)
- Manages PostHog client initialization
- Provides utility functions for tracking events, identifying users, etc.
- Handles errors gracefully
- Includes proper shutdown functionality

### 2. React Hook (`src/hooks/usePostHog.ts`)
- Provides easy-to-use interface for frontend components
- Handles API calls to backend analytics endpoints
- Includes TypeScript types for better developer experience

### 3. API Route (`src/app/api/analytics/track/route.ts`)
- Secure backend endpoint for tracking events
- Validates requests and handles errors
- Bridges frontend and PostHog service

### 4. Events Definition (`src/lib/analytics/events.ts`)
- Centralized event names and properties
- TypeScript interfaces for type safety
- Consistent event structure across the application

## Usage Examples

### Basic Event Tracking

```typescript
import { usePostHog } from '@/hooks/usePostHog';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

function MyComponent() {
  const { trackEvent } = usePostHog('user-123');

  const handleButtonClick = async () => {
    await trackEvent({
      event: ANALYTICS_EVENTS.FEATURE_USED,
      properties: {
        feature: 'export_button',
        page: 'dashboard',
      },
    });
  };

  return <button onClick={handleButtonClick}>Export Data</button>;
}
```

### User Identification

```typescript
import { usePostHog } from '@/hooks/usePostHog';

function UserProfile() {
  const { identifyUser } = usePostHog('user-123');

  useEffect(() => {
    identifyUser({
      email: 'user@example.com',
      plan: 'professional',
      properties_count: 5,
      user_type: 'landlord',
    });
  }, [identifyUser]);

  return <div>User Profile</div>;
}
```

### Property Creation Tracking

```typescript
const handlePropertyCreation = async (propertyData) => {
  try {
    // Create property in database
    const property = await createProperty(propertyData);

    // Track successful creation
    await trackEvent({
      event: ANALYTICS_EVENTS.PROPERTY_CREATED,
      properties: {
        property_id: property.id,
        property_type: propertyData.type,
        bedrooms: propertyData.bedrooms,
        rent_amount: propertyData.rent,
        success: true,
      },
    });
  } catch (error) {
    // Track failed creation
    await trackEvent({
      event: ANALYTICS_EVENTS.PROPERTY_CREATED,
      properties: {
        success: false,
        error_message: error.message,
      },
    });
  }
};
```

## Backend Usage

For server-side tracking (e.g., in API routes):

```typescript
import { trackEvent, identifyUser } from '@/lib/services/posthog';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  
  // Track server-side event
  await trackEvent(userId, 'api_call', {
    endpoint: '/api/properties',
    method: 'POST',
    success: true,
  });

  // Update user properties
  await identifyUser(userId, {
    last_api_call: new Date().toISOString(),
  });

  return Response.json({ success: true });
}
```

## Key Events to Track

### User Journey
- `user_signed_up` - New user registration
- `user_logged_in` - User authentication
- `onboarding_completed` - Onboarding flow completion

### Property Management
- `property_created` - New property added
- `property_updated` - Property information changed
- `property_viewed` - Property details accessed

### Financial Operations
- `bank_account_connected` - Plaid integration
- `transaction_categorized` - Manual transaction categorization
- `rent_payment_received` - Rent payment processing

### WhatsApp Integration
- `whatsapp_connected` - WhatsApp Business Account linked
- `whatsapp_message_sent` - Message sent to tenant
- `whatsapp_message_received` - Message received from tenant

### Tax Operations
- `tax_return_started` - Tax return process initiated
- `hmrc_connected` - HMRC integration completed
- `tax_document_generated` - Tax form created

## Best Practices

### 1. Event Naming
- Use consistent, descriptive event names
- Follow the pattern: `object_action` (e.g., `property_created`)
- Use the centralized `ANALYTICS_EVENTS` constants

### 2. Property Structure
- Include relevant context (user_id, property_id, etc.)
- Add success/failure indicators for operations
- Include timestamps and environment information

### 3. Error Handling
- Always wrap tracking calls in try-catch blocks
- Don't let analytics failures break user functionality
- Log analytics errors for debugging

### 4. Performance
- Use async/await for non-blocking tracking
- Consider batching events for high-frequency operations
- Don't track overly granular events that could impact performance

### 5. Privacy
- Only track necessary data
- Respect user privacy preferences
- Ensure compliance with GDPR and other regulations

## Testing

### Development Environment
In development, events will be tagged with `environment: 'development'` to separate them from production data.

### Testing Events
```typescript
// Test event tracking in development
const { trackEvent } = usePostHog('test-user-123');

await trackEvent({
  event: 'test_event',
  properties: {
    test: true,
    timestamp: new Date().toISOString(),
  },
});
```

## Monitoring and Debugging

### Console Logging
The PostHog service includes console logging for errors. Check browser/server console for:
- Failed API calls
- Missing user IDs
- Network errors

### PostHog Dashboard
Monitor events in your PostHog dashboard:
1. Go to https://eu.i.posthog.com
2. Check Events tab for incoming data
3. Use Insights to create custom analytics

## Shutdown Handling

For proper cleanup (especially important in serverless environments):

```typescript
import { shutdownPostHog } from '@/lib/services/posthog';

// In your application shutdown handler
process.on('SIGTERM', async () => {
  await shutdownPostHog();
  process.exit(0);
});
```

## Troubleshooting

### Common Issues

1. **Events not appearing in PostHog**
   - Check API key and host configuration
   - Verify network connectivity
   - Check browser console for errors

2. **TypeScript errors**
   - Ensure all event properties match defined interfaces
   - Check import paths for analytics modules

3. **Performance issues**
   - Reduce event frequency for high-traffic operations
   - Use batching for bulk operations
   - Consider async processing for complex tracking

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

This will add additional console output for tracking operations.

## Next Steps

1. **Custom Dashboards**: Create PostHog dashboards specific to ZenRent metrics
2. **Feature Flags**: Consider using PostHog's feature flag functionality
3. **A/B Testing**: Implement PostHog's experimentation features
4. **Cohort Analysis**: Set up user cohorts based on behavior patterns
5. **Alerts**: Configure alerts for important business metrics

## Support

For PostHog-specific issues, refer to:
- [PostHog Documentation](https://posthog.com/docs)
- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node)
- [PostHog Community](https://posthog.com/questions)

For ZenRent-specific analytics questions, contact the development team. 