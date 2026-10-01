import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { Eyebrow } from './Eyebrow'

interface PageHeaderProps {
  title: string
  eyebrow?: string
  description?: ReactNode
  /** Buttons aligned to the end of the title row. */
  actions?: ReactNode
  className?: string
}

/** The page's only `<h1>`, in serif. */
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-4', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-serif text-display-lg text-ink">{title}</h1>
        {description && (
          <p className="max-w-2xl text-body text-ink-muted text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
