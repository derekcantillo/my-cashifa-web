import { create } from 'zustand'

type GoalModalMode = 'create' | 'edit' | 'contribute'

interface GoalModalState {
  isOpen: boolean
  mode: GoalModalMode
  /** Edit: the goal being edited. Contribute: the preselected goal (fixed in the form). */
  goalId?: string
  open: (mode: 'create' | 'edit', goalId?: string) => void
  /** Opens the contribution modal, on `goalId` when given. */
  contribute: (goalId?: string) => void
  close: () => void
}

export const useGoalModalStore = create<GoalModalState>()(set => ({
  isOpen: false,
  mode: 'create',
  goalId: undefined,
  open: (mode, goalId) => set({ isOpen: true, mode, goalId }),
  contribute: goalId => set({ isOpen: true, mode: 'contribute', goalId }),
  close: () => set({ isOpen: false, goalId: undefined }),
}))
