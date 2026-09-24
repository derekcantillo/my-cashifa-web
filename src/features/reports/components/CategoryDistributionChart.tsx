import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useReportDistribution } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import type { Category, DistributionItem } from '@/types'

/** More slices than this fold into one neutral "Other" slice (no generated hues). */
const MAX_SLICES = 7
const OTHER_COLOR = 'color-mix(in srgb, var(--color-ink) 22%, transparent)'

interface Slice {
  key: Category | 'OTHER_GROUP'
  label: string
  amount: number
  color: string
}

export function CategoryDistributionChart({ periodId }: { periodId: string | undefined }) {
  const { t } = useTranslation(['reports', 'categories'])
  const { money, locale } = useFormatters()
  const { data, isPending, isError, refetch } = useReportDistribution(periodId)
  const [hovered, setHovered] = useState<Slice | null>(null)
  // Resetting on a native `mouseleave` of the container, not React's onMouseLeave: the
  // hover re-render makes Recharts replace the sector <path> under the pointer, and React
  // can't trace a `mouseout` from a detached node, so the label would stay stuck.
  // Callback ref: the listener attaches whenever the chart element mounts.
  const chartRef = useCallback((element: HTMLDivElement | null) => {
    element?.addEventListener('mouseleave', () => setHovered(null))
  }, [])
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })

  // The backend already limits this to EXPENSE transactions, so nothing is filtered
  // here: an expense filed under e.g. SALARY is still spending.
  const items = [...(data ?? [])]
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  const folded = items.length > MAX_SLICES
  const shown = folded ? items.slice(0, MAX_SLICES - 1) : items
  const rest = folded ? items.slice(MAX_SLICES - 1) : []
  const colorOf = (item: DistributionItem) =>
    rest.includes(item) ? OTHER_COLOR : CATEGORY_META[item.category].color
  const slices: Slice[] = [
    ...shown.map(item => ({
      key: item.category,
      label: t(CATEGORY_META[item.category].translationKey),
      amount: item.amount,
      color: CATEGORY_META[item.category].color,
    })),
    ...(rest.length
      ? [
          {
            key: 'OTHER_GROUP' as const,
            label: t('reports:distribution.other'),
            amount: rest.reduce((sum, item) => sum + item.amount, 0),
            color: OTHER_COLOR,
          },
        ]
      : []),
  ]

  return (
    <section
      aria-labelledby="distribution-title"
      className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-6"
    >
      <h2 id="distribution-title" className="font-semibold">
        {t('reports:distribution.title')}
      </h2>

      {isError ? (
        <InlineError onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="mx-auto size-52 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-ink-muted">{t('reports:distribution.empty')}</p>
      ) : (
        <>
          <div className="relative mx-auto h-56 max-w-xs">
            <div
              role="img"
              aria-label={t('reports:distribution.description')}
              className="h-full"
              ref={chartRef}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    // 2px surface gap between slices.
                    stroke="var(--color-surface-elevated)"
                    strokeWidth={2}
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => setHovered(slices[index] ?? null)}
                  >
                    {slices.map(slice => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Hover swaps the center text (category + amount) instead of a floating
                tooltip that would cover it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center"
            >
              <span className="max-w-full truncate text-sm text-ink-muted">
                {hovered ? hovered.label : t('reports:distribution.total')}
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {money(hovered ? hovered.amount : total)}
              </span>
            </div>
          </div>

          {/* The legend and the chart's table view: every category, largest first. */}
          <ul className="divide-y divide-border text-sm">
            {items.map(item => {
              const meta = CATEGORY_META[item.category]
              const Icon = meta.icon
              return (
                <li key={item.category} className="flex items-center gap-3 py-2.5">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorOf(item) }}
                  />
                  <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{t(meta.translationKey)}</span>
                  <span className="font-medium tabular-nums">{money(item.amount)}</span>
                  <span className="w-12 text-right text-ink-muted tabular-nums">
                    {percent.format(item.percentage / 100)}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
