import { QueryClient } from '@tanstack/react-query'
import axios from 'axios'

const MAX_RETRIES = 3

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx (not found, unauthorized, invalid input) won't fix itself on retry.
      retry: (failureCount, error) => {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status !== undefined && status >= 400 && status < 500) return false
        return failureCount < MAX_RETRIES
      },
    },
  },
})
