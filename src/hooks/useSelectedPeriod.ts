import { useMemo } from 'react'

import { usePeriodStore } from '@/store/periodStore'
import type { FinancialPeriod } from '@/types'

import { usePeriods } from './usePeriods'

interface SelectedPeriod {
  period: FinancialPeriod | undefined
  periodId: string | undefined
  isLoading: boolean
  goToPrevious: () => void
  goToNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

/**
 * The single source of truth for the active financial period (header selector,
 * dashboard, and any screen that needs a `periodId`).
 *
 * The default is derived rather than written to the store in an effect: while the
 * user hasn't navigated (or the stored id no longer exists, e.g. after a salary
 * was deleted and periods merged), the current period is selected.
 */
export function useSelectedPeriod(): SelectedPeriod {
  const { data, isPending } = usePeriods()
  const selectedPeriodId = usePeriodStore(state => state.selectedPeriodId)
  const setSelectedPeriodId = usePeriodStore(state => state.setSelectedPeriodId)

  const periods = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [data],
  )

  const selectedIndex = periods.findIndex(period => period.id === selectedPeriodId)
  const currentIndex = periods.findIndex(period => period.isCurrent)
  const index =
    selectedIndex !== -1 ? selectedIndex : currentIndex !== -1 ? currentIndex : periods.length - 1

  const period = periods[index]
  const previous = index > 0 ? periods[index - 1] : undefined
  const next = index !== -1 && index < periods.length - 1 ? periods[index + 1] : undefined

  return {
    period,
    periodId: period?.id,
    isLoading: isPending,
    goToPrevious: () => previous && setSelectedPeriodId(previous.id),
    goToNext: () => next && setSelectedPeriodId(next.id),
    canGoPrevious: previous !== undefined,
    canGoNext: next !== undefined,
  }
}
