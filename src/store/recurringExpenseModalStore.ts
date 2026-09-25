import { create } from 'zustand'

interface RecurringExpenseModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  recurringExpenseId?: string
  open: (mode: 'create' | 'edit', recurringExpenseId?: string) => void
  close: () => void
}

export const useRecurringExpenseModalStore = create<RecurringExpenseModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  recurringExpenseId: undefined,
  open: (mode, recurringExpenseId) => set({ isOpen: true, mode, recurringExpenseId }),
  close: () => set({ isOpen: false, recurringExpenseId: undefined }),
}))
