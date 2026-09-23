import { Navigate, Outlet } from 'react-router-dom'

import { useApiKeyStore } from '@/api'
import { ROUTES } from '@/lib/routes'

/** Layout route guard: sends the user to /setup until an API Key is stored. */
export function RequireApiKey() {
  const apiKey = useApiKeyStore(state => state.apiKey)

  if (!apiKey) {
    return <Navigate to={ROUTES.setup} replace />
  }

  return <Outlet />
}
