import type { QueryClient, QueryKey } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'

function invalidateAll(queryClient: QueryClient, keys: readonly QueryKey[]): Promise<void> {
  return Promise.all(keys.map(queryKey => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  )
}

/**
 * Everything the backend recomputes when money moves. Creating, editing or deleting a
 * transaction (and goal contributions / loans, which write transactions) triggers a
 * cascade server-side: a SALARY income opens or merges financial periods, the period
 * ledger and budgets are recalculated, budget alerts may be created, account balances,
 * reports and net worth change. Invalidating by domain prefix only refetches queries
 * that are currently mounted; the rest just go stale.
 */
export function invalidateFinancialState(queryClient: QueryClient): Promise<void> {
  return invalidateAll(queryClient, [
    queryKeys.periods.all,
    queryKeys.periodLedger.all,
    queryKeys.transactions.all,
    queryKeys.budgets.all,
    queryKeys.recurringExpenses.all,
    queryKeys.reports.all,
    queryKeys.alerts.all,
    queryKeys.accounts.all,
    queryKeys.netWorth,
  ])
}

export function invalidateQueries(
  queryClient: QueryClient,
  ...keys: readonly QueryKey[]
): Promise<void> {
  return invalidateAll(queryClient, keys)
}
