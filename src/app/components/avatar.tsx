'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  square?: boolean
  alt?: string
}

export function Avatar({ className, src, square = false, alt = '', ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden',
        square ? 'rounded-lg' : 'rounded-full',
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            {alt.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      )}
    </div>
  )
}
