/**
 * Every React Query key in the app. Each domain has an `all` root so a mutation can
 * invalidate the whole domain by prefix (`invalidateQueries({ queryKey: queryKeys.x.all })`).
 */
export const queryKeys = {
  periods: {
    all: ['periods'] as const,
    current: ['periods', 'current'] as const,
  },
  periodLedger: {
    all: ['periodLedger'] as const,
    byPeriod: (periodId: string | undefined) => ['periodLedger', periodId] as const,
  },
  accounts: {
    all: ['accounts'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    byPeriod: (periodId: string | undefined) => ['transactions', 'period', periodId] as const,
    detail: (id: string | undefined) => ['transactions', 'detail', id] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    byPeriod: (periodId: string | undefined) => ['budgets', periodId] as const,
  },
  budgetRules: {
    all: ['budgetRules'] as const,
  },
  goals: {
    all: ['goals'] as const,
    detail: (id: string | undefined) => ['goals', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    summary: (periodId: string | undefined) => ['reports', 'summary', periodId] as const,
    distribution: (periodId: string | undefined) => ['reports', 'distribution', periodId] as const,
    savingsProjection: ['reports', 'savingsProjection'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (unreadOnly = false) => ['alerts', 'list', unreadOnly] as const,
    unreadCount: ['alerts', 'unreadCount'] as const,
  },
  recurringExpenses: {
    all: ['recurringExpenses'] as const,
    pending: (periodId: string | undefined) => ['recurringExpenses', 'pending', periodId] as const,
  },
  loans: {
    all: ['loans'] as const,
    detail: (id: string | undefined) => ['loans', id] as const,
  },
  settings: ['settings'] as const,
  netWorth: ['netWorth'] as const,
}
