import { create } from 'zustand'

import type { RecurringExpense } from '@/types'

/** Create mode of a transfer: "Pagar tarjeta" preselects a credit card as destination. */
export interface TransferModalPreset {
  toAccountId?: string
  cardPayment?: boolean
}

interface TransactionModalState {
  isOpen: boolean
  /** `transfer` creates one; an existing transfer opens in `edit` like any movement. */
  mode: 'create' | 'edit' | 'transfer'
  transactionId?: string
  /** Create mode: start linked to this recurring expense ("Registrar" on a pending one). */
  recurringExpense?: RecurringExpense
  /** Transfer mode: starting destination. */
  transfer?: TransferModalPreset
  open: (mode: 'create' | 'edit', transactionId?: string) => void
  openForRecurring: (recurringExpense: RecurringExpense) => void
  openTransfer: (preset?: TransferModalPreset) => void
  close: () => void
}

const CLOSED_EXTRAS = { transactionId: undefined, recurringExpense: undefined, transfer: undefined }

export const useTransactionModalStore = create<TransactionModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  ...CLOSED_EXTRAS,
  open: (mode, transactionId) => set({ ...CLOSED_EXTRAS, isOpen: true, mode, transactionId }),
  openForRecurring: recurringExpense =>
    set({ ...CLOSED_EXTRAS, isOpen: true, mode: 'create', recurringExpense }),
  openTransfer: (preset = {}) =>
    set({ ...CLOSED_EXTRAS, isOpen: true, mode: 'transfer', transfer: preset }),
  close: () => set({ ...CLOSED_EXTRAS, isOpen: false }),
}))
