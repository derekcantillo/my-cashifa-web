import { create } from 'zustand'

interface TransactionModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  transactionId?: string
  open: (mode: 'create' | 'edit', transactionId?: string) => void
  close: () => void
}

export const useTransactionModalStore = create<TransactionModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  transactionId: undefined,
  open: (mode, transactionId) => set({ isOpen: true, mode, transactionId }),
  close: () => set({ isOpen: false, transactionId: undefined }),
}))
