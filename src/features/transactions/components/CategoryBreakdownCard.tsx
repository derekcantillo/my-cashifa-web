import { useTranslation } from 'react-i18next'

import { Card, CardHeader, ProgressBar, SectionError, Skeleton } from '@/components/ui'
import { useFormatters, useReportDistribution } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { formatPercent } from '@/lib/format'
import type { DistributionItem } from '@/types'

const TOP = 5

interface BreakdownRow {
  key: string
  label: string
  amount: number
  /** 0–100, share of the period's EXPENSE. */
  percentage: number
}

interface CategoryBreakdownCardProps {
  periodId: string | undefined
  className?: string
}

/**
 * Expense split by category (GET /reports/distribution — EXPENSE only). One accent
 * for every bar: per-category colors come back with the Reports redesign.
 */
export function CategoryBreakdownCard({ periodId, className }: CategoryBreakdownCardProps) {
  const { t } = useTranslation(['transactions', 'categories'])
  const { locale, money } = useFormatters()
  const { data, isPending, isError, refetch } = useReportDistribution(periodId)

  const rows = data
    ? toRows(
        data,
        category => t(CATEGORY_META[category].translationKey),
        t('transactions:breakdown.others'),
      )
    : []

  return (
    <Card as="section" aria-labelledby="breakdown-title" className={className}>
      <CardHeader title={t('transactions:breakdown.title')} titleId="breakdown-title" />

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending ? (
        <ul aria-busy className="mt-4 space-y-4">
          {[0, 1, 2, 3].map(index => (
            <li key={index} className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-body text-ink-muted">{t('transactions:breakdown.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map(row => {
            const percent = formatPercent(row.percentage / 100, { locale })
            return (
              <li key={row.key} className="space-y-1.5">
                <div className="flex items-baseline gap-3 text-body-sm">
                  <span className="min-w-0 flex-1 truncate text-ink">{row.label}</span>
                  <span className="font-medium text-ink tabular-nums">{money(row.amount)}</span>
                  <span className="w-10 text-right text-ink-muted tabular-nums">{percent}</span>
                </div>
                <ProgressBar
                  value={row.percentage}
                  label={t('transactions:breakdown.share', { percentage: percent })}
                  className="h-1.5"
                />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/** Biggest five categories, the rest folded into "Otras". */
function toRows(
  items: readonly DistributionItem[],
  labelOf: (category: DistributionItem['category']) => string,
  othersLabel: string,
): BreakdownRow[] {
  const sorted = [...items].filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount)
  const rows: BreakdownRow[] = sorted.slice(0, TOP).map(item => ({
    key: item.category,
    label: labelOf(item.category),
    amount: item.amount,
    percentage: item.percentage,
  }))
  const rest = sorted.slice(TOP)
  if (rest.length > 0) {
    rows.push({
      key: 'others',
      label: othersLabel,
      amount: rest.reduce((sum, item) => sum + item.amount, 0),
      percentage: rest.reduce((sum, item) => sum + item.percentage, 0),
    })
  }
  return rows
}
