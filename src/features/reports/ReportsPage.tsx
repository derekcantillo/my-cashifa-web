import { useTranslation } from 'react-i18next'

import { Enter, PageHeader } from '@/components/ui'
import { usePeriodLabel, useSelectedPeriod } from '@/hooks'

import { CategoryCard } from './components/CategoryCard'
import { DailySpendingCard } from './components/DailySpendingCard'
import { GoalSavingsCard } from './components/GoalSavingsCard'
import { ReportsHero } from './components/ReportsHero'

/** Read-only screen: the selected period's numbers, plus savings in goals (all time). */
export function ReportsPage() {
  const { t } = useTranslation('reports')
  const { period, periodId, previousPeriod } = useSelectedPeriod()
  const periodLabel = usePeriodLabel(period)

  return (
    <div className="space-y-10">
      <Enter order={0}>
        <PageHeader eyebrow={periodLabel ?? t('eyebrowLoading')} title={t('title')} />
      </Enter>

      <Enter order={1}>
        <ReportsHero period={period} previousPeriod={previousPeriod} />
      </Enter>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Enter order={2} className="min-w-0 lg:col-span-7">
          <DailySpendingCard period={period} className="h-full" />
        </Enter>
        <Enter order={3} className="min-w-0 lg:col-span-5">
          <CategoryCard periodId={periodId} className="h-full" />
        </Enter>
        <Enter order={4} className="min-w-0 lg:col-span-12">
          <GoalSavingsCard />
        </Enter>
      </div>
    </div>
  )
}
