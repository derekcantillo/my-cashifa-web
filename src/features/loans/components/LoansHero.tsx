import { useTranslation } from 'react-i18next'

import { Amount, Eyebrow, HeroProgress, Stat } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { loanTotals, nextDueLoan } from '@/lib/loanMath'
import { progressPercent } from '@/lib/goalMath'
import type { Loan } from '@/types'

/** Stacked on narrow screens (hairline between rows); one row split by hairlines from `md`. */
const CELL = 'py-4 md:px-6 md:py-1 md:first:pl-0 md:last:pr-0'

/**
 * "Por cobrar" = what open loans still owe — the same rule as `/net-worth`
 * `receivables` (shared helper `loanTotals`). Rendered when there's at least one loan.
 */
export function LoansHero({ loans }: { loans: readonly Loan[] }) {
  const { t } = useTranslation('loans')
  const { locale, money } = useFormatters()
  const totals = loanTotals(loans)
  const next = nextDueLoan(loans)

  return (
    <div className="space-y-8">
      <section aria-labelledby="loans-hero-label" className="space-y-3">
        <Eyebrow as="h2" id="loans-hero-label">
          {t('hero.label')}
        </Eyebrow>
        <Amount value={totals.outstanding} variant="hero" className="text-ink" />
        {totals.activeCount === 0 ? (
          <p className="text-body text-ink-muted">{t('hero.upToDate')}</p>
        ) : (
          <HeroProgress
            value={progressPercent(totals.activeRecovered, totals.activeLent)}
            label={t('hero.progress')}
            caption={t('hero.recovered', {
              recovered: money(totals.activeRecovered),
              lent: money(totals.activeLent),
            })}
            className="pt-3"
          />
        )}
      </section>

      <div
        className={cn(
          'grid divide-y divide-line border-y border-line md:divide-x md:divide-y-0 md:border-y-0',
          next?.dueDate ? 'md:grid-cols-4' : 'md:grid-cols-3',
        )}
      >
        <Stat label={t('stats.active')} className={CELL} value={totals.activeCount} />
        <Stat
          label={t('stats.totalLent')}
          className={CELL}
          value={<Amount value={totals.totalLent} />}
          hint={t('stats.totalLentHint')}
        />
        <Stat
          label={t('stats.recovered')}
          className={CELL}
          value={<Amount value={totals.totalRecovered} />}
          hint={t('stats.recoveredHint')}
        />
        {next?.dueDate && (
          <Stat
            label={t('stats.nextDue')}
            className={CELL}
            value={formatDate(next.dueDate, {
              locale,
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            hint={<span className="line-clamp-1">{next.borrowerName}</span>}
          />
        )}
      </div>
    </div>
  )
}
