/** The part of a React Query result the screen reads — lets the showcase pass mock states. */
export interface QueryState<T> {
  data: T | undefined
  isPending: boolean
  isError: boolean
  refetch: () => unknown
}
