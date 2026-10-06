import { useAccounts, useGoals, useLoans, useNetWorth } from '@/hooks'

import { NetWorthView } from './components/NetWorthView'

/**
 * Read-only. Reuses the cached queries of the other screens: GET /net-worth for the
 * figures, and accounts / loans / goals for the rows. No period: it's today's snapshot.
 */
export function NetWorthPage() {
  return (
    <NetWorthView
      netWorth={useNetWorth()}
      accounts={useAccounts()}
      loans={useLoans()}
      goals={useGoals()}
    />
  )
}
