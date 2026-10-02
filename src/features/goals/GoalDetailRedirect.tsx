import { Navigate, useParams } from 'react-router-dom'

import { goalPath, ROUTES } from '@/lib/routes'

/** `/metas/:id` → `/metas?goal=:id`. */
export function GoalDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? goalPath(id) : ROUTES.goals} replace />
}
