// Load polyfills for server-side compatibility
require('./polyfills.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  // swcMinify is now default in Next.js 15, removed deprecated option
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security and performance
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true, // Optimize CSS
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'], // Tree shake icon libraries
  },

  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during production builds
    ignoreBuildErrors: true,
  },
  
  // Optimized image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    dangerouslyAllowSVG: true,
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
    // Performance optimizations
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Add fallbacks for browser-only APIs
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
      
      // Add externals for server-side rendering
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });
    }

    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      );
    }
    
    // Production optimizations - temporarily disable vendor chunk splitting
    if (!dev) {
      // Temporarily comment out vendor chunk splitting to debug the issue
      // config.optimization = {
      //   ...config.optimization,
      //   splitChunks: {
      //     chunks: 'all',
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name: 'vendors',
      //         chunks: 'all',
      //       },
      //       common: {
      //         name: 'common',
      //         minChunks: 2,
      //         chunks: 'all',
      //         enforce: true,
      //       },
      //     },
      //   },
      // };
    }
    
    return config;
  },

  serverRuntimeConfig: {
    // Will only be available on the server side
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RESEND_API_KEY: process.env.NEXT_PUBLIC_RESEND_API_KEY,
  },
  env: {
    NEXT_PUBLIC_FB_APP_ID: process.env.NEXT_PUBLIC_FB_APP_ID || '953206047023164',
    NEXT_PUBLIC_FB_CONFIG_ID: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
    // SECURITY: FB_APP_SECRET should NEVER be exposed in client-side code
    // This should only be used server-side and accessed via process.env
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN
  },
}

module.exports = nextConfig

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "zenrent",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
