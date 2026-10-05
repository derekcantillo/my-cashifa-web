import { Navigate, useParams } from 'react-router-dom'

import { loanPath, ROUTES } from '@/lib/routes'

/** `/prestamos/:id` → `/prestamos?loan=:id`. */
export function LoanDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? loanPath(id) : ROUTES.loans} replace />
}
