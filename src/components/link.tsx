import * as Headless from '@headlessui/react'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import React, { forwardRef } from 'react'
import type { InertiaLinkProps } from '../inertiajs-react'

// Create a hybrid Link component that works with Next.js but has a similar API to Inertia.js
export const Link = forwardRef<
  HTMLAnchorElement,
  NextLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & Omit<InertiaLinkProps, 'href'>
>(function Link({ href, preserveScroll, preserveState, only, headers, method, replace, data, as, ...props }, ref) {
  // For now, we're ignoring Inertia.js specific props and just using Next.js Link
  // This prevents the TypeError while still allowing the code to work
  return (
    <Headless.DataInteractive>
      <NextLink href={href} {...props} ref={ref} />
    </Headless.DataInteractive>
  )
}) 