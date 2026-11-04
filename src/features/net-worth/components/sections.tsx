import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Amount, buttonClassName, SectionError, Skeleton } from '@/components/ui'
import { cn } from '@/lib/cn'

import type { QueryState } from '../lib/queryState'

export interface AssetSectionProps<T> {
  headingId: string
  title: string
  subtotal: number | undefined
  subtotalPending: boolean
  list: QueryState<T>
  footer: ReactNode
  children: (data: T) => ReactNode
}

export function AssetSection<T>({
  headingId,
  title,
  subtotal,
  subtotalPending,
  list,
  footer,
  children,
}: AssetSectionProps<T>) {
  return (
    <section aria-labelledby={headingId} className="py-5 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        {/* Focus target of the hero bar's segments. */}
        <h3
          id={headingId}
          tabIndex={-1}
          className="scroll-mt-24 text-body-sm font-semibold text-ink focus:outline-none"
        >
          {title}
        </h3>
        {subtotal !== undefined ? (
          <Amount
            value={subtotal}
            className={cn('text-body font-medium', subtotal < 0 ? 'text-negative' : 'text-ink')}
          />
        ) : (
          subtotalPending && <Skeleton className="h-4 w-24" />
        )}
      </div>

      <div className="mt-2">
        {list.isError ? (
          <SectionError onRetry={() => void list.refetch()} className="my-2" />
        ) : list.isPending || list.data === undefined ? (
          <div aria-busy className="space-y-3 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          children(list.data)
        )}
      </div>

      {!list.isError && <div className="mt-2">{footer}</div>}
    </section>
  )
}

export const rowClassName = '-mx-3 flex min-h-12 items-center gap-4 rounded-md px-3 py-2'
export const linkRowClassName = cn(rowClassName, 'transition-tactile hover:bg-surface-sunken/70')

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="flex min-h-12 items-center text-body text-ink-muted">{children}</p>
}

export function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={buttonClassName({ variant: 'link', size: 'sm' })}>
      {children}
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  )
}
