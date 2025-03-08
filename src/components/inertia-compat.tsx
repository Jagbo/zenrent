/**
 * This file provides compatibility components for Inertia.js in a Next.js environment
 */

import React from 'react'
import { Link } from './link'

// Create a compatibility Head component
export function Head({ title, children }: { title?: string; children?: React.ReactNode }) {
  // In Next.js, you would typically use next/head or the metadata API
  // This is a simplified version for compatibility
  React.useEffect(() => {
    if (title) {
      document.title = title
    }
  }, [title])

  return <>{children}</>
}

// Re-export Link for convenience
export { Link }

// Create a compatibility usePage hook
export function usePage() {
  // This is a simplified mock of Inertia.js's usePage hook
  return {
    props: {
      // Add any global props your app might expect
      auth: {
        user: null // or mock user data
      },
      // Add other props as needed
    },
    url: typeof window !== 'undefined' ? window.location.pathname : '/',
    component: '',
    version: '',
    // Add other properties as needed
  }
}

// Create a compatibility useForm hook (simplified)
export function useForm<TForm extends Record<string, any>>(initialValues: TForm) {
  const [data, setFormData] = React.useState(initialValues)
  
  return {
    data,
    setData: (key: keyof TForm | Partial<TForm>, value?: any) => {
      if (typeof key === 'object') {
        setFormData(prev => ({ ...prev, ...key }))
      } else {
        setFormData(prev => ({ ...prev, [key]: value }))
      }
    },
    post: (url: string, options: any = {}) => {
      console.log('Form submission to', url, 'with data', data)
      // In a real implementation, you'd use fetch or a similar API
    },
    // Add other methods as needed
  }
} 