import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useFormatters } from '@/hooks'
import {
  OTHERS_FILL,
  type BreakdownItem,
  type CategoryBreakdown as Breakdown,
} from '@/lib/categoryBreakdown'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { cn } from '@/lib/cn'
import { formatPercent } from '@/lib/format'
import type { Category } from '@/types'

/** Below 1% a share reads "<1%" instead of a misleading "0%". */
export function formatShare(percent: number, locale: string): string {
  if (percent > 0 && percent < 1) return `<${formatPercent(0.01, { locale })}`
  return formatPercent(Math.round(percent) / 100, { locale })
}

const OTHERS_KEY = 'others'

interface CategoryBreakdownViewProps {
  breakdown: Breakdown
  /** Where a category leads (Gastos filtered by it). */
  hrefFor: (category: Category) => string
}

/**
 * Segmented bar + list, colored by rank (see `buildCategoryBreakdown`). Color is never
 * alone: every segment and row carries name, amount and share. Hovering or focusing a
 * row highlights its segment and vice versa (the rest drop to 55%).
 */
export function CategoryBreakdownView({ breakdown, hrefFor }: CategoryBreakdownViewProps) {
  const { t } = useTranslation(['common', 'categories'])
  const { locale, money } = useFormatters()
  const [active, setActive] = useState<string | null>(null)
  const [othersOpen, setOthersOpen] = useState(false)

  const name = (category: Category) => t(CATEGORY_META[category].translationKey)
  const describe = (label: string, amount: number, percent: number) =>
    t('common:categoryBreakdown.itemLabel', {
      name: label,
      amount: money(amount),
      percent: formatShare(percent, locale),
    })
  const highlight = (key: string | null) => ({
    onMouseEnter: () => setActive(key),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(key),
    onBlur: () => setActive(null),
  })
  const dimmed = (key: string) => active !== null && active !== key

  const segments = [
    ...breakdown.items.map(item => ({
      key: item.category,
      label: describe(name(item.category), item.amount, item.percent),
      percent: item.percent,
      fillClass: item.fillClass,
      href: hrefFor(item.category),
    })),
    ...(breakdown.others
      ? [
          {
            key: OTHERS_KEY,
            label: describe(
              t('common:categoryBreakdown.othersName'),
              breakdown.others.amount,
              breakdown.others.percent,
            ),
            percent: breakdown.others.percent,
            fillClass: OTHERS_FILL,
            href: undefined,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-5">
      {/* 2px gaps show the card's own surface between segments. */}
      <div
        role="group"
        aria-label={t('common:categoryBreakdown.barLabel')}
        className="flex h-2.5 gap-0.5"
      >
        {segments.map((segment, index) => {
          const className = cn(
            'h-full min-w-1 transition-opacity duration-150 motion-reduce:transition-none',
            segment.fillClass,
            index === 0 && 'rounded-l-full',
            index === segments.length - 1 && 'rounded-r-full',
            dimmed(segment.key) && 'opacity-55',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
          )
          const style = { flex: `${segment.percent} 1 0` }
          return segment.href ? (
            <Link
              key={segment.key}
              to={segment.href}
              aria-label={segment.label}
              title={segment.label}
              className={className}
              style={style}
              {...highlight(segment.key)}
            />
          ) : (
            <button
              key={segment.key}
              type="button"
              aria-label={segment.label}
              title={segment.label}
              aria-expanded={othersOpen}
              onClick={() => setOthersOpen(value => !value)}
              className={className}
              style={style}
              {...highlight(segment.key)}
            />
          )
        })}
      </div>

      <ul className="divide-y divide-line">
        {breakdown.items.map(item => (
          <li key={item.category}>
            <BreakdownRow
              item={item}
              label={name(item.category)}
              fillClass={item.fillClass}
              href={hrefFor(item.category)}
              dimmed={dimmed(item.category)}
              highlight={highlight(item.category)}
            />
          </li>
        ))}
        {breakdown.others && (
          <li>
            <button
              type="button"
              aria-expanded={othersOpen}
              onClick={() => setOthersOpen(value => !value)}
              {...highlight(OTHERS_KEY)}
              className={cn(
                rowClassName,
                'w-[calc(100%+1.5rem)] text-left',
                dimmed(OTHERS_KEY) && 'opacity-55',
              )}
            >
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', OTHERS_FILL)} />
              <ChevronRight
                aria-hidden
                className={cn(
                  'size-[18px] shrink-0 text-ink-muted transition-transform motion-reduce:transition-none',
                  othersOpen && 'rotate-90',
                )}
              />
              <span
                title={t('common:categoryBreakdown.others', {
                  count: breakdown.others.categories.length,
                })}
                className="min-w-0 flex-1 truncate text-body text-ink"
              >
                {t('common:categoryBreakdown.others', {
                  count: breakdown.others.categories.length,
                })}
              </span>
              <span className="text-body font-medium text-ink tabular-nums">
                {money(breakdown.others.amount)}
              </span>
              <span className="w-12 text-right text-body-sm text-ink-muted tabular-nums">
                {formatShare(breakdown.others.percent, locale)}
              </span>
            </button>
            {othersOpen && (
              <ul className="pb-1 pl-5">
                {breakdown.others.categories.map(item => (
                  <li key={item.category}>
                    <BreakdownRow
                      item={item}
                      label={name(item.category)}
                      fillClass={OTHERS_FILL}
                      href={hrefFor(item.category)}
                      dimmed={false}
                      highlight={highlight(OTHERS_KEY)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}
      </ul>
    </div>
  )
}

const rowClassName =
  '-mx-3 flex min-h-12 items-center gap-3 rounded-md px-3 py-2 transition-tactile hover:bg-surface-sunken/70'

interface BreakdownRowProps {
  item: BreakdownItem
  label: string
  fillClass: string
  href: string
  dimmed: boolean
  highlight: Record<'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur', () => void>
}

function BreakdownRow({ item, label, fillClass, href, dimmed, highlight }: BreakdownRowProps) {
  const { locale, money } = useFormatters()
  const Icon = CATEGORY_META[item.category].icon
  return (
    <Link to={href} {...highlight} className={cn(rowClassName, 'flex', dimmed && 'opacity-55')}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', fillClass)} />
      <Icon aria-hidden className="size-[18px] shrink-0 text-ink-muted" />
      <span title={label} className="min-w-0 flex-1 truncate text-body text-ink">
        {label}
      </span>
      <span className="text-body font-medium text-ink tabular-nums">{money(item.amount)}</span>
      <span className="w-12 text-right text-body-sm text-ink-muted tabular-nums">
        {formatShare(item.percent, locale)}
      </span>
    </Link>
  )
}
