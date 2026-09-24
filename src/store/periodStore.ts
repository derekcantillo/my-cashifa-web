import { create } from 'zustand'

interface PeriodState {
  /** `null` until the user navigates; `useSelectedPeriod` then falls back to the current period. */
  selectedPeriodId: string | null
  setSelectedPeriodId: (id: string) => void
}

export const usePeriodStore = create<PeriodState>()(set => ({
  selectedPeriodId: null,
  setSelectedPeriodId: id => set({ selectedPeriodId: id }),
}))
