import { create } from 'zustand'

/** Create, or edit (`accountId`) an account of "Mis productos". */
interface AccountModalState {
  isOpen: boolean
  accountId?: string
  open: (accountId?: string) => void
  close: () => void
}

export const useAccountModalStore = create<AccountModalState>()(set => ({
  isOpen: false,
  accountId: undefined,
  open: accountId => set({ isOpen: true, accountId }),
  close: () => set({ isOpen: false, accountId: undefined }),
}))
