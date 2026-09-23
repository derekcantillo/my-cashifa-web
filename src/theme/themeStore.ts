import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'auto'
export type ResolvedTheme = Exclude<Theme, 'auto'>

/** Also read by the pre-paint script in index.html — keep both in sync. */
export const THEME_STORAGE_KEY = 'cashifa-theme'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'auto',
      setTheme: theme => set({ theme }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: ({ theme }) => ({ theme }),
    },
  ),
)
