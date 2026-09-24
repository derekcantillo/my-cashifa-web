import { useTranslation } from 'react-i18next'

import { useSelectedPeriod } from '@/hooks'

import { BalanceHero } from './components/BalanceHero'
import { GoalsSummary } from './components/GoalsSummary'
import { LoanTeaser } from './components/LoanTeaser'
import { NetWorthTeaser } from './components/NetWorthTeaser'
import { RecentTransactionsList } from './components/RecentTransactionsList'

export function DashboardPage() {
  const { t } = useTranslation('layout')
  const { periodId, isLoading } = useSelectedPeriod()

  return (
    <div className="space-y-12">
      <h1 className="sr-only">{t('nav.dashboard')}</h1>

      <BalanceHero periodId={periodId} isPeriodLoading={isLoading} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <RecentTransactionsList periodId={periodId} />
        <aside className="space-y-10">
          <GoalsSummary />
          <LoanTeaser />
          <NetWorthTeaser />
        </aside>
      </div>
    </div>
  )
}
