import { toDateInputValue } from '@/lib/format'
import { getTransactionDirection } from '@/lib/transactionDirection'
import { isTransfer } from '@/lib/transfers'
import type { Category, Transaction } from '@/types'

export type DirectionFilter = 'all' | 'income' | 'expense' | 'transfer'

export interface ListFilters {
  direction: DirectionFilter
  /** Free text, matched against the note and the category name. */
  query: string
  /** '' = every category. */
  category: Category | ''
}

export const NO_FILTERS: ListFilters = { direction: 'all', query: '', category: '' }

/** Lowercase without accents, so "credito" finds "Crédito". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

const MATCHES_DIRECTION: Record<DirectionFilter, (transaction: Transaction) => boolean> = {
  all: () => true,
  income: transaction => getTransactionDirection(transaction.type) === 'in',
  expense: transaction => getTransactionDirection(transaction.type) === 'out',
  transfer: isTransfer,
}

/**
 * Search + category, i.e. everything but the direction (the segmented control counts by
 * it). A transfer has no real category (the backend stores OTHER): it never matches a
 * category filter, and the search looks at its label ("Transferencia") and account names.
 */
export function matchesSearchAndCategory(
  transaction: Transaction,
  filters: Pick<ListFilters, 'query' | 'category'>,
  categoryLabel: (category: Category) => string,
  transferLabel = '',
): boolean {
  const transfer = isTransfer(transaction)
  if (filters.category && (transfer || transaction.category !== filters.category)) return false
  const query = normalizeForSearch(filters.query)
  if (!query) return true
  const texts = transfer
    ? [
        transaction.description ?? '',
        transferLabel,
        transaction.account?.name ?? '',
        transaction.toAccount?.name ?? '',
      ]
    : [transaction.description ?? '', categoryLabel(transaction.category)]
  return texts.some(text => normalizeForSearch(text).includes(query))
}

/** Categories the period's movements use, for the category filter (transfers have none). */
export function categoriesOf(transactions: readonly Transaction[]): Category[] {
  return [
    ...new Set(
      transactions
        .filter(transaction => !isTransfer(transaction))
        .map(transaction => transaction.category),
    ),
  ]
}

export function countByDirection(
  transactions: readonly Transaction[],
): Record<DirectionFilter, number> {
  return {
    all: transactions.length,
    income: transactions.filter(MATCHES_DIRECTION.income).length,
    expense: transactions.filter(MATCHES_DIRECTION.expense).length,
    transfer: transactions.filter(MATCHES_DIRECTION.transfer).length,
  }
}

export function matchesDirection(transaction: Transaction, direction: DirectionFilter): boolean {
  return MATCHES_DIRECTION[direction](transaction)
}

export interface DayGroup {
  /** `YYYY-MM-DD`, Bogotá. */
  dateKey: string
  transactions: Transaction[]
  /** Money out that day (EXPENSE + DEBT_PAYMENT). */
  spent: number
  /** Money in that day (INCOME + LOAN_REPAYMENT). */
  earned: number
}

/** Newest day first, newest movement first within a day. */
export function groupByDay(transactions: readonly Transaction[]): DayGroup[] {
  const sorted = [...transactions].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate),
  )
  const groups = new Map<string, DayGroup>()
  for (const transaction of sorted) {
    const dateKey = toDateInputValue(transaction.transactionDate)
    const group = groups.get(dateKey) ?? { dateKey, transactions: [], spent: 0, earned: 0 }
    group.transactions.push(transaction)
    const direction = getTransactionDirection(transaction.type)
    if (direction === 'out') group.spent += transaction.amount
    if (direction === 'in') group.earned += transaction.amount
    groups.set(dateKey, group)
  }
  return [...groups.values()]
}
