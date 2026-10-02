import { useTranslation } from 'react-i18next'

import { Amount, Eyebrow, HeroProgress, Stat } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { formatDate, formatPercent } from '@/lib/format'
import {
  displayPercent,
  progressPercent,
  requiredContribution,
  totalRequiredContribution,
} from '@/lib/goalMath'
import type { Goal } from '@/types'

/** Stacked on phones (hairline between rows); a row split by vertical hairlines from `sm`. */
const CELL = 'py-4 sm:px-8 sm:py-1 sm:first:pl-0 sm:last:pr-0'

/**
 * Hero + stats of the goals screen, from ACTIVE goals only (paused and completed ones
 * don't count). Rendered only when there is at least one active goal.
 */
export function GoalsHero({ active }: { active: readonly Goal[] }) {
  const { t } = useTranslation('goals')
  const { locale, money } = useFormatters()
  const now = new Date()

  const saved = active.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const target = active.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const required = totalRequiredContribution(active, now)
  const overdue = active.filter(goal => requiredContribution(goal, now).kind === 'overdue').length
  // Lists are sorted by date: the first not yet past is the next one.
  const next = active.find(goal => requiredContribution(goal, now).kind !== 'overdue')
  const percent = formatPercent(displayPercent(saved, target) / 100, { locale })

  return (
    <div className="space-y-8">
      <section aria-labelledby="goals-hero-label" className="space-y-3">
        <Eyebrow as="h2" id="goals-hero-label">
          {t('hero.label')}
        </Eyebrow>
        <Amount value={saved} variant="hero" className="text-ink" />
        <HeroProgress
          value={progressPercent(saved, target)}
          label={t('hero.progress')}
          caption={t('hero.of', { target: money(target), percent })}
          className="pt-3"
        />
      </section>

      <div className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y-0">
        <Stat label={t('stats.active')} className={CELL} value={active.length} />
        <Stat
          label={t('stats.required')}
          className={CELL}
          value={<Amount value={required} />}
          hint={overdue > 0 ? t('stats.overdueCount', { count: overdue }) : t('stats.requiredHint')}
        />
        {next && (
          <Stat
            label={t('stats.next')}
            className={CELL}
            value={formatDate(next.targetDate, {
              locale,
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            hint={<span className="line-clamp-1">{next.name}</span>}
          />
        )}
      </div>
    </div>
  )
}
