import { skipToken } from '@tanstack/react-query'

/**
 * Builds a `queryFn` that only runs once `param` is defined. Returning `skipToken`
 * disables the query exactly like `enabled: !!param`, but keeps `param` typed as
 * defined inside the fetcher (no non-null assertions).
 */
export function skipUnless<TParam, TData>(
  param: TParam | undefined,
  fetcher: (param: TParam) => Promise<TData>,
) {
  return param === undefined || param === '' ? skipToken : () => fetcher(param)
}
