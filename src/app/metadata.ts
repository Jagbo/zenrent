import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZenRent',
  description: 'Property management made simple',
  icons: {
    icon: [
      {
        url: '/images/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        url: '/images/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/images/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/images/safari-pinned-tab.svg',
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