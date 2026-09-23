import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'

import { useThemeStore, type ResolvedTheme, type Theme } from './themeStore'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemScheme(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function subscribeNoop(): () => void {
  return () => {}
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches
}

const ResolvedThemeContext = createContext<ResolvedTheme | null>(null)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore(state => state.theme)

  // Only listen to OS changes while in 'auto'; the snapshot is always read fresh,
  // so switching back to 'auto' picks up the current OS preference.
  const systemPrefersDark = useSyncExternalStore(
    theme === 'auto' ? subscribeToSystemScheme : subscribeNoop,
    getSystemPrefersDark,
  )

  const resolvedTheme: ResolvedTheme =
    theme === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  return (
    <ResolvedThemeContext.Provider value={resolvedTheme}>{children}</ResolvedThemeContext.Provider>
  )
}

interface UseThemeResult {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export function useTheme(): UseThemeResult {
  const resolvedTheme = useContext(ResolvedThemeContext)
  const theme = useThemeStore(state => state.theme)
  const setTheme = useThemeStore(state => state.setTheme)

  if (resolvedTheme === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return { theme, resolvedTheme, setTheme }
}
