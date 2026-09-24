import { CreditCard, HandCoins, Landmark, PiggyBank, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InlineError, Skeleton } from '@/components/ui'
import { useFormatters, useNetWorth } from '@/hooks'
import { cn } from '@/lib/utils'

import { BreakdownLine } from './components/BreakdownLine'
import { BreakdownSection } from './components/BreakdownSection'
import { LIABILITIES_IMPLEMENTED } from './liabilitiesSupport'

/** Read-only: no forms or actions here. */
export function NetWorthPage() {
  const { t } = useTranslation('netWorth')
  const { money } = useFormatters()
  const { data, isPending, isError, refetch } = useNetWorth()

  if (isError) {
    return <InlineError onRetry={() => void refetch()} />
  }

  if (isPending) {
    return (
      <div className="space-y-12" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-14 w-72 max-w-full" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {[3, 2].map(lines => (
            <div key={lines} className="space-y-4 rounded-2xl border border-border p-6">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: lines }, (_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { assets, liabilities, netWorth } = data
  // Same formula as the backend (creditCardsAvailable is a 0 placeholder there too).
  const totalAssets =
    assets.accountsBalance + assets.receivables + assets.goalsSavings + assets.creditCardsAvailable
  const totalLiabilities = liabilities.debts + liabilities.creditCardsDebt

  return (
    <div className="space-y-12">
      <section aria-labelledby="net-worth-label" className="space-y-3">
        <h1 id="net-worth-label" className="text-ink-muted">
          {t('title')}
        </h1>
        {/* The sign matters here, so it's colored (unlike the other heroes). No trend:
            there's no history to compare against. */}
        <p
          className={cn(
            'text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl',
            netWorth > 0 && 'text-success',
            netWorth < 0 && 'text-danger',
          )}
        >
          {money(netWorth)}
        </p>
        {!LIABILITIES_IMPLEMENTED && (
          <p className="text-sm text-ink-muted">{t('liabilitiesPending')}</p>
        )}
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <BreakdownSection id="assets-title" title={t('assets')} subtotal={totalAssets}>
          <BreakdownLine icon={Wallet} label={t('accounts')} amount={assets.accountsBalance} />
          {/* Shown even at 0: it's real data that changes as loans are repaid. */}
          <BreakdownLine icon={HandCoins} label={t('receivables')} amount={assets.receivables} />
          <BreakdownLine icon={PiggyBank} label={t('goalsSavings')} amount={assets.goalsSavings} />
        </BreakdownSection>

        <BreakdownSection
          id="liabilities-title"
          title={t('liabilities')}
          // A "$0" subtotal would read as "no debts", which isn't known yet.
          subtotal={LIABILITIES_IMPLEMENTED ? totalLiabilities : null}
        >
          <BreakdownLine
            icon={Landmark}
            label={t('debts')}
            amount={liabilities.debts}
            comingSoon={!LIABILITIES_IMPLEMENTED}
          />
          <BreakdownLine
            icon={CreditCard}
            label={t('creditCards')}
            amount={liabilities.creditCardsDebt}
            comingSoon={!LIABILITIES_IMPLEMENTED}
          />
        </BreakdownSection>
      </div>
    </div>
  )
}
