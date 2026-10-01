import { cn } from '@/lib/cn'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

/** Hairline separator — preferred over boxing content in cards. */
export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-line',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
    />
  )
}
