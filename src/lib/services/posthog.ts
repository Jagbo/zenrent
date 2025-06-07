import { PostHog } from 'posthog-node'

// PostHog configuration
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_1vnwbI0NJez98xBTvnJrE7UvPsj4uVMynMfbcejp9Zd'
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'

// Create PostHog client instance
let posthogClient: PostHog | null = null

/**
 * Get or create PostHog client instance
 * @returns PostHog client instance
 */
export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Additional configuration options
      flushAt: 20, // Flush events when we have 20 events
      flushInterval: 10000, // Flush events every 10 seconds
    })
  }
  return posthogClient
}

/**
 * Track an event in PostHog
 * @param distinctId - Unique identifier for the user
 * @param event - Event name
 * @param properties - Event properties
 */
export async function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    const client = getPostHogClient()
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date(),
        source: 'zenrent-backend',
      },
    })
  } catch (error) {
    console.error('Failed to track PostHog event:', error)
  }
}

/**
 * Identify a user in PostHog
 * @param distinctId - Unique identifier for the user
 * @param properties - User properties
 */
export async function identifyUser(
  distinctId: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    const client = getPostHogClient()
    client.identify({
      distinctId,
      properties: {
        ...properties,
        platform: 'zenrent',
        environment: process.env.NODE_ENV || 'development',
      },
    })
  } catch (error) {
    console.error('Failed to identify user in PostHog:', error)
  }
}

/**
 * Set user properties in PostHog
 * @param distinctId - Unique identifier for the user
 * @param properties - Properties to set
 */
export async function setUserProperties(
  distinctId: string,
  properties: Record<string, any>
): Promise<void> {
  try {
    const client = getPostHogClient()
    client.capture({
      distinctId,
      event: '$set',
      properties,
    })
  } catch (error) {
    console.error('Failed to set user properties in PostHog:', error)
  }
}

/**
 * Track page view in PostHog
 * @param distinctId - Unique identifier for the user
 * @param path - Page path
 * @param properties - Additional properties
 */
export async function trackPageView(
  distinctId: string,
  path: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    await trackEvent(distinctId, '$pageview', {
      $current_url: path,
      ...properties,
    })
  } catch (error) {
    console.error('Failed to track page view in PostHog:', error)
  }
}

/**
 * Gracefully shutdown PostHog client
 * Call this when your application is shutting down
 */
export async function shutdownPostHog(): Promise<void> {
  try {
    if (posthogClient) {
      await posthogClient.shutdown()
      posthogClient = null
    }
  } catch (error) {
    console.error('Failed to shutdown PostHog client:', error)
  }
}

// Export the client for direct access if needed
export { posthogClient } 