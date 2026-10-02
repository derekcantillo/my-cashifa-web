import { create } from 'zustand'

import type { RecurringExpense } from '@/types'

interface TransactionModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  transactionId?: string
  /** Create mode: start linked to this recurring expense ("Registrar" on a pending one). */
  recurringExpense?: RecurringExpense
  open: (mode: 'create' | 'edit', transactionId?: string) => void
  openForRecurring: (recurringExpense: RecurringExpense) => void
  close: () => void
}

export const useTransactionModalStore = create<TransactionModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  transactionId: undefined,
  recurringExpense: undefined,
  open: (mode, transactionId) =>
    set({ isOpen: true, mode, transactionId, recurringExpense: undefined }),
  openForRecurring: recurringExpense =>
    set({ isOpen: true, mode: 'create', transactionId: undefined, recurringExpense }),
  close: () => set({ isOpen: false, transactionId: undefined, recurringExpense: undefined }),
}))
