export const ROUTES = {
  setup: '/setup',
  dashboard: '/',
  transactions: '/gastos',
  goals: '/metas',
  /** Old detail URL: redirects to `/metas?goal=:id`. */
  goalDetail: '/metas/:id',
  reports: '/reportes',
  loans: '/prestamos',
  /** Old detail URL: redirects to `/prestamos?loan=:id`. */
  loanDetail: '/prestamos/:id',
  alerts: '/alertas',
  netWorth: '/patrimonio-neto',
  settings: '/ajustes',
  /** Development only. */
  designShowcase: '/__design',
} as const

/** Query param holding the selected goal on the goals screen. */
export const GOAL_PARAM = 'goal'

/** The goals screen with `id` selected (list + detail live on one route). */
export function goalPath(id: string): string {
  return `${ROUTES.goals}?${GOAL_PARAM}=${encodeURIComponent(id)}`
}

/** Query param holding the selected loan on the loans screen. */
export const LOAN_PARAM = 'loan'

/** The loans screen with `id` selected (list + detail live on one route). */
export function loanPath(id: string): string {
  return `${ROUTES.loans}?${LOAN_PARAM}=${encodeURIComponent(id)}`
}

/** Query param that preselects the category filter on Gastos. */
export const CATEGORY_PARAM = 'category'

/** Gastos filtered by a category. */
export function transactionsByCategoryPath(category: string): string {
  return `${ROUTES.transactions}?${CATEGORY_PARAM}=${encodeURIComponent(category)}`
}
