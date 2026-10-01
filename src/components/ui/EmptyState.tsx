import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  /** Plain line icon — no colored chip behind it. */
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icon && <Icon aria-hidden strokeWidth={1.25} className="mb-5 size-8 text-ink-subtle" />}
      <h2 className="font-serif text-display-md text-ink">{title}</h2>
      {description && (
        <p className="mt-3 max-w-sm text-body text-ink-muted text-pretty">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
