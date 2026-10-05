import { create } from 'zustand'

type LoanModalMode = 'create' | 'edit' | 'repay'

interface LoanModalState {
  isOpen: boolean
  mode: LoanModalMode
  /** Edit: the loan being edited. Repay: the loan receiving the repayment. */
  loanId?: string
  open: (mode: LoanModalMode, loanId?: string) => void
  close: () => void
}

export const useLoanModalStore = create<LoanModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  loanId: undefined,
  open: (mode, loanId) => set({ isOpen: true, mode, loanId }),
  close: () => set({ isOpen: false, loanId: undefined }),
}))
