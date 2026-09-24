import { useTranslation } from 'react-i18next'

import { useSelectedPeriod } from '@/hooks'

import { CategoryDistributionChart } from './components/CategoryDistributionChart'
import { ReportSummaryHero } from './components/ReportSummaryHero'
import { SavingsProjectionChart } from './components/SavingsProjectionChart'

export function ReportsPage() {
  const { t } = useTranslation('reports')
  const { periodId } = useSelectedPeriod()

  return (
    <div className="space-y-12">
      <h1 className="sr-only">{t('title')}</h1>
      <ReportSummaryHero periodId={periodId} />
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <CategoryDistributionChart periodId={periodId} />
        <SavingsProjectionChart />
      </div>
    </div>
  )
}
