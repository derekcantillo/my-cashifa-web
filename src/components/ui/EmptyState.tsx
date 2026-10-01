import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  /** Plain line icon — no colored chip behind it. */
  icon?: LucideIcon
  action?: ReactNode
  /** `sm` for empty states inside a card. */
  size?: 'sm' | 'md'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const small = size === 'sm'
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        small ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          strokeWidth={1.25}
          className={cn('text-ink-subtle', small ? 'mb-3 size-6' : 'mb-5 size-8')}
        />
      )}
      <h3 className={cn('font-serif text-ink', small ? 'text-display-sm' : 'text-display-md')}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'max-w-sm text-ink-muted text-pretty',
            small ? 'mt-2 text-body-sm' : 'mt-3 text-body',
          )}
        >
          {description}
        </p>
      )}
      {action && <div className={small ? 'mt-5' : 'mt-6'}>{action}</div>}
    </div>
  )
}
