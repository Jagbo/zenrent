// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://1e817a851838dfb934067a0ce13d8016@o4509457421434880.ingest.de.sentry.io/4509457700552784",

  // Removed session replay integration for performance
  // Session replays were causing significant performance overhead
  integrations: [
    // Sentry.replayIntegration(), // REMOVED - was causing 20+ second load times
  ],

  // Reduced trace sampling for better performance
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

  // Disabled session replays completely for performance
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Disable debug in production
  debug: process.env.NODE_ENV === 'development',

  // Performance optimizations
  beforeSend(event) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
        return null; // Don't send chunk load errors
      }
    }
    return event;
  },

  // Reduce data collection for performance
  maxBreadcrumbs: 50, // Default is 100
  attachStacktrace: false, // Disable for performance
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;