import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZenRent',
  description: 'Property management made simple',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        url: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#D9E8FF',
      },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#D9E8FF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZenRent',
  },
} 