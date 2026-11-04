import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/lib/queryKeys'

import { invalidateAccountState, invalidateFinancialState } from './invalidation'

describe('invalidateFinancialState', () => {
  it('refreshes what a transfer changes: movements, balances, net worth and reports', async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateFinancialState(queryClient)

    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
    expect(keys).toEqual(
      expect.arrayContaining([
        queryKeys.transactions.all,
        queryKeys.accounts.all,
        queryKeys.netWorth,
        queryKeys.reports.all,
      ]),
    )
  })
})

describe('invalidateAccountState', () => {
  it('refreshes accounts (and their adjustment history), institutions, net worth and movements', async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateAccountState(queryClient)

    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
    expect(keys).toEqual([
      queryKeys.accounts.all,
      queryKeys.institutions.all,
      queryKeys.netWorth,
      queryKeys.transactions.all,
    ])
    // The history lives under the accounts prefix, so it goes stale with them.
    expect(queryKeys.accounts.adjustments('acc_1').slice(0, 1)).toEqual(queryKeys.accounts.all)
  })
})
