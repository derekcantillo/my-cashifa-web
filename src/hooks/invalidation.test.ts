import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/lib/queryKeys'

import { invalidateFinancialState } from './invalidation'

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
