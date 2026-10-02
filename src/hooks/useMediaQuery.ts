import { useCallback, useSyncExternalStore } from 'react'

/** Whether a CSS media query matches, kept in sync with resizes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Tailwind's `lg` breakpoint (1024px): where list + detail sit side by side. */
export const DESKTOP_QUERY = '(min-width: 1024px)'
