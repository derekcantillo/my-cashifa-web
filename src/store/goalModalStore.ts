import { create } from 'zustand'

interface GoalModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  goalId?: string
  open: (mode: 'create' | 'edit', goalId?: string) => void
  close: () => void
}

export const useGoalModalStore = create<GoalModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  goalId: undefined,
  open: (mode, goalId) => set({ isOpen: true, mode, goalId }),
  close: () => set({ isOpen: false, goalId: undefined }),
}))
