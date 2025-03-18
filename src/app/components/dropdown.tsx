'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DropdownRootProps {
  children: React.ReactNode
}

interface DropdownButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  outline?: boolean
  children: React.ReactNode
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string
  children: React.ReactNode
}

const DropdownContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}>({
  isOpen: false,
  setIsOpen: () => {},
  buttonRef: React.createRef<HTMLButtonElement | null>()
})

const Dropdown = ({ children }: DropdownRootProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, buttonRef }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

const DropdownButton = React.forwardRef<HTMLButtonElement, DropdownButtonProps>(
  ({ className, outline, children, onClick, ...props }, _ref) => {
    const { setIsOpen, isOpen, buttonRef } = React.useContext(DropdownContext)
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsOpen(!isOpen)
      onClick?.(e)
    }

    return (
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
          outline
            ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            : 'bg-zinc-900 text-white hover:bg-zinc-800',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownButton.displayName = 'DropdownButton'

const DropdownMenu = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isOpen } = React.useContext(DropdownContext)
  
  if (!isOpen) return null

  return (
    <div
      className={cn(
        'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  )
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, href, children, ...props }, ref) => {
    const { setIsOpen } = React.useContext(DropdownContext)
    const baseClassName = cn(
      'block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
      className
    )

    if (href) {
      return (
        <Link href={href} className={baseClassName} onClick={() => setIsOpen(false)}>
          {children}
        </Link>
      )
    }

    return (
      <button 
        ref={ref} 
        type="button" 
        className={baseClassName} 
        onClick={(e) => {
          props.onClick?.(e)
          setIsOpen(false)
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownItem.displayName = 'DropdownItem'

export { Dropdown, DropdownButton, DropdownMenu, DropdownItem }
