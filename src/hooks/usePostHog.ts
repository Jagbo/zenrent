import { useCallback } from 'react'

interface TrackEventParams {
  event: string
  properties?: Record<string, any>
  userProperties?: Record<string, any>
}

interface UsePostHogReturn {
  trackEvent: (params: TrackEventParams) => Promise<void>
  trackPageView: (path: string, properties?: Record<string, any>) => Promise<void>
  identifyUser: (userProperties: Record<string, any>) => Promise<void>
}

/**
 * Hook for PostHog analytics integration
 * @param distinctId - Unique identifier for the user (usually user ID)
 */
export function usePostHog(distinctId?: string): UsePostHogReturn {
  const trackEvent = useCallback(
    async ({ event, properties, userProperties }: TrackEventParams) => {
      if (!distinctId) {
        console.warn('PostHog: No distinctId provided, skipping event tracking')
        return
      }

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            distinctId,
            event,
            properties,
            userProperties,
          }),
        })
      } catch (error) {
        console.error('Failed to track event:', error)
      }
    },
    [distinctId]
  )

  const trackPageView = useCallback(
    async (path: string, properties?: Record<string, any>) => {
      await trackEvent({
        event: '$pageview',
        properties: {
          $current_url: path,
          ...properties,
        },
      })
    },
    [trackEvent]
  )

  const identifyUser = useCallback(
    async (userProperties: Record<string, any>) => {
      if (!distinctId) {
        console.warn('PostHog: No distinctId provided, skipping user identification')
        return
      }

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            distinctId,
            event: '$identify',
            userProperties,
          }),
        })
      } catch (error) {
        console.error('Failed to identify user:', error)
      }
    },
    [distinctId]
  )

  return {
    trackEvent,
    trackPageView,
    identifyUser,
  }
}

// Example usage in a React component:
/*
import { usePostHog } from '@/hooks/usePostHog'

function PropertyForm() {
  const { trackEvent } = usePostHog('user-123')

  const handlePropertyCreated = async (propertyData) => {
    await trackEvent({
      event: 'property_created',
      properties: {
        property_type: propertyData.type,
        location: propertyData.location,
        rent_amount: propertyData.rent,
      },
    })
  }

  return (
    // Your component JSX
  )
}
*/ 