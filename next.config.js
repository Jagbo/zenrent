/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during production builds
    ignoreBuildErrors: true,
  },
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
    NEXT_PUBLIC_FB_APP_ID: '953206047023164',
    NEXT_PUBLIC_FB_CONFIG_ID: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
    FB_APP_SECRET: '76e16d5ea4d3dd0dbb21c41703947995',
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token'
  },
}

module.exports = nextConfig