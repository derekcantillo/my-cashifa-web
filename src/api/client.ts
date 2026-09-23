import axios from 'axios'

import { ROUTES } from '@/lib/routes'

import { useApiKeyStore } from './apiKeyStore'

const API_KEY_HEADER_NAME = import.meta.env.VITE_API_KEY_HEADER_NAME || 'x-api-key'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use(config => {
  const { apiKey } = useApiKeyStore.getState()
  if (apiKey) {
    config.headers.set(API_KEY_HEADER_NAME, apiKey)
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  (error: unknown) => {
    if (isUnauthorizedError(error)) {
      useApiKeyStore.getState().clearApiKey()
      // Already on /setup (e.g. validating a new key): let the screen show the error
      // instead of reloading the page.
      if (window.location.pathname !== ROUTES.setup) {
        window.location.href = ROUTES.setup
      }
    }
    return Promise.reject(error)
  },
)

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
