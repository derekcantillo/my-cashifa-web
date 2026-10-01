export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = Exclude<Theme, 'system'>

/** Also read by the pre-paint script in index.html — keep both in sync. */
export const THEME_STORAGE_KEY = 'cashifa:theme'
/** Pre-redesign key (zustand persist JSON, 'auto' instead of 'system'); migrated once. */
const LEGACY_THEME_STORAGE_KEY = 'cashifa-theme'

export const THEMES: readonly Theme[] = ['light', 'dark', 'system']

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

function readLegacyTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (!raw) return null
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    const parsed: unknown = JSON.parse(raw)
    const legacy =
      typeof parsed === 'object' && parsed !== null && 'state' in parsed
        ? (parsed.state as { theme?: unknown }).theme
        : undefined
    const theme = legacy === 'auto' ? 'system' : legacy
    return isTheme(theme) ? theme : null
  } catch {
    return null
  }
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
    const legacy = readLegacyTheme()
    if (legacy) {
      localStorage.setItem(THEME_STORAGE_KEY, legacy)
      return legacy
    }
  } catch {
    // Storage unavailable (private mode, blocked site data): fall back to the OS.
  }
  return 'system'
}

let currentTheme: Theme = readStoredTheme()
const listeners = new Set<() => void>()

/** Minimal external store, read through `useSyncExternalStore` in ThemeProvider. */
export const themeStore = {
  get: (): Theme => currentTheme,
  set: (theme: Theme): void => {
    currentTheme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Not persisted, but still applied for this session.
    }
    listeners.forEach(listener => listener())
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
