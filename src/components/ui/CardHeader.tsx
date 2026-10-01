import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface CardHeaderProps {
  title: string
  /** Id for the card's `aria-labelledby`. */
  titleId?: string
  /** Trailing link or control, aligned to the title's baseline. */
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, titleId, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <h2 id={titleId} className="text-body font-semibold text-ink">
        {title}
      </h2>
      {action}
    </div>
  )
}
