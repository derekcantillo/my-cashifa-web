import { useQuery } from '@tanstack/react-query'

import { netWorthRepository } from '@/api/netWorth'
import { queryKeys } from '@/lib/queryKeys'

export function useNetWorth() {
  return useQuery({
    queryKey: queryKeys.netWorth,
    queryFn: () => netWorthRepository.get(),
    staleTime: 5 * 60 * 1000,
  })
}
