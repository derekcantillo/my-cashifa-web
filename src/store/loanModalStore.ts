import { create } from 'zustand'

interface LoanModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  loanId?: string
  open: (mode: 'create' | 'edit', loanId?: string) => void
  close: () => void
}

export const useLoanModalStore = create<LoanModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  loanId: undefined,
  open: (mode, loanId) => set({ isOpen: true, mode, loanId }),
  close: () => set({ isOpen: false, loanId: undefined }),
}))
