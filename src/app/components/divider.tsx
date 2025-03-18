import { cn } from '@/lib/utils'

interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  return (
    <div
      className={cn(
        'h-px w-full bg-zinc-200 dark:bg-zinc-800',
        className
      )}
      role="separator"
    />
  )
}
