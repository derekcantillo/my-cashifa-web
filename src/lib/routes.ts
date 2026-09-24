export const ROUTES = {
  setup: '/setup',
  dashboard: '/',
  transactions: '/gastos',
  goals: '/metas',
  goalDetail: '/metas/:id',
  reports: '/reportes',
  loans: '/prestamos',
  alerts: '/alertas',
  netWorth: '/patrimonio-neto',
  settings: '/ajustes',
} as const

export function goalPath(id: string): string {
  return `/metas/${id}`
}
