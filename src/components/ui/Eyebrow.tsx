import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EyebrowProps {
  children: ReactNode
  as?: 'p' | 'span' | 'h2' | 'h3' | 'dt'
  id?: string
  className?: string
}

/** Small uppercase label that introduces a figure or a section. */
export function Eyebrow({ children, as: Element = 'p', id, className }: EyebrowProps) {
  return (
    <Element id={id} className={cn('text-eyebrow text-ink-muted uppercase', className)}>
      {children}
    </Element>
  )
}
