import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { DESKTOP_QUERY, useMediaQuery } from './useMediaQuery'

interface ListNavigationState {
  /** The detail was opened from the list on this screen (so "← back" can use history). */
  fromList?: boolean
}

interface MasterDetailOptions<T extends { id: string }> {
  items: readonly T[] | undefined
  /** Query param holding the selected id (`goal`, `loan`). */
  param: string
  /** Shown when the URL has no (valid) id. Desktop only: phones show the list. */
  defaultItem: T | undefined
  /** URL of the screen with `id` selected. */
  pathFor: (id: string) => string
}

/**
 * Selection of a list + detail screen (Metas, Préstamos): the selected id lives in the
 * URL (reload and Back keep it); an unknown id falls back to the default silently.
 */
export function useMasterDetail<T extends { id: string }>({
  items,
  param,
  defaultItem,
  pathFor,
}: MasterDetailOptions<T>) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const requested = items?.find(item => item.id === params.get(param))
  // Below `lg` without an id only the list shows (the default detail stays hidden).
  const selected = requested ?? defaultItem

  return {
    /** The item named in the URL, if any (below `lg` it means "detail view"). */
    requested,
    selected,
    isDesktop,
    select: (item: T) => {
      if (item.id === selected?.id && isDesktop) return
      navigate(pathFor(item.id), { state: { fromList: true } satisfies ListNavigationState })
    },
    backToList: () => {
      if ((location.state as ListNavigationState | null)?.fromList) navigate(-1)
      else setParams({}, { replace: true })
    },
    clearSelection: () => setParams({}, { replace: true }),
  }
}
