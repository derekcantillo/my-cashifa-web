import { create } from 'zustand'

/** Create-only: the backend has no endpoint to edit or delete an account. */
interface AccountModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useAccountModalStore = create<AccountModalState>()(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
