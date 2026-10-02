import { useTranslation } from 'react-i18next'

import { Enter } from '@/components/ui'
import { useSelectedPeriod } from '@/hooks'

import { GoalsCard } from './components/GoalsCard'
import { HomeHero } from './components/HomeHero'
import { NetWorthCard } from './components/NetWorthCard'
import { ReceivablesCard } from './components/ReceivablesCard'
import { RecentTransactionsCard } from './components/RecentTransactionsCard'
import { SpendingPaceCard } from './components/SpendingPaceCard'

export function HomePage() {
  const { t } = useTranslation('home')
  const { period, periodId, isLoading } = useSelectedPeriod()

  return (
    <div className="space-y-10">
      {/* The hero is the visual header; the title stays for the document outline. */}
      <h1 className="sr-only">{t('title')}</h1>

      <Enter order={0}>
        <HomeHero period={period} isPeriodLoading={isLoading} />
      </Enter>

      {(isLoading || period) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Enter order={1} className="lg:col-span-7">
            <SpendingPaceCard period={period} className="h-full" />
          </Enter>
          <Enter order={2} className="lg:col-span-5">
            <GoalsCard className="h-full" />
          </Enter>
          <Enter order={3} className="lg:col-span-7">
            <RecentTransactionsCard periodId={periodId} className="h-full" />
          </Enter>
          <Enter order={4} className="space-y-6 lg:col-span-5">
            <NetWorthCard />
            <ReceivablesCard />
          </Enter>
        </div>
      )}
    </div>
  )
}
