export const ROUTES = {
  setup: '/setup',
  dashboard: '/',
  transactions: '/gastos',
  goals: '/metas',
  goalDetail: '/metas/:id',
  reports: '/reportes',
  loans: '/prestamos',
  loanDetail: '/prestamos/:id',
  alerts: '/alertas',
  netWorth: '/patrimonio-neto',
  settings: '/ajustes',
} as const

export function goalPath(id: string): string {
  return `/metas/${id}`
}

export function loanPath(id: string): string {
  return `/prestamos/${id}`
}
