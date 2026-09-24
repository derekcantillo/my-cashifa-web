import type { ReactNode } from 'react'

import { useFormatters } from '@/hooks'

interface BreakdownSectionProps {
  id: string
  title: string
  /** `null` hides the subtotal (e.g. when every line is still "coming soon"). */
  subtotal: number | null
  children: ReactNode
}

export function BreakdownSection({ id, title, subtotal, children }: BreakdownSectionProps) {
  const { money } = useFormatters()

  return (
    <section
      aria-labelledby={id}
      className="space-y-2 rounded-2xl border border-border bg-surface-elevated p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {subtotal !== null && (
          <span className="text-ink-muted tabular-nums">{money(subtotal)}</span>
        )}
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  )
}
