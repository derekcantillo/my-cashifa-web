import type { Loan } from '@/types'

/**
 * Loan arithmetic shared by Préstamos and Inicio. The backend already returns each
 * loan's `remainingAmount` (= amount − amountRepaid); "open" is anything not PAID
 * (ACTIVE or PARTIALLY_PAID) — the same rule GET /net-worth uses for `receivables`.
 */
export function isOpenLoan(loan: Pick<Loan, 'status'>): boolean {
  return loan.status !== 'PAID'
}

/** "Por cobrar": what open loans still owe. Matches `/net-worth` `assets.receivables`. */
export function receivables(loans: readonly Pick<Loan, 'status' | 'remainingAmount'>[]): number {
  return loans.filter(isOpenLoan).reduce((sum, loan) => sum + loan.remainingAmount, 0)
}

export interface LoanTotals {
  /** Open loans. */
  activeCount: number
  /** Still owed on open loans (`receivables`). */
  outstanding: number
  /** Lent / recovered on open loans only (hero bar). */
  activeLent: number
  activeRecovered: number
  /** Historical: every loan, paid ones included. */
  totalLent: number
  /** Sum of every repayment (`amountRepaid` is the running sum of a loan's repayments). */
  totalRecovered: number
}

export function loanTotals(
  loans: readonly Pick<Loan, 'status' | 'amount' | 'amountRepaid' | 'remainingAmount'>[],
): LoanTotals {
  const open = loans.filter(isOpenLoan)
  const sum = (items: typeof loans, pick: (loan: (typeof loans)[number]) => number) =>
    items.reduce((total, loan) => total + pick(loan), 0)
  return {
    activeCount: open.length,
    outstanding: receivables(loans),
    activeLent: sum(open, loan => loan.amount),
    activeRecovered: sum(open, loan => loan.amountRepaid),
    totalLent: sum(loans, loan => loan.amount),
    totalRecovered: sum(loans, loan => loan.amountRepaid),
  }
}

/**
 * Open loans first: by due date (soonest first; no due date after those), then the
 * oldest loan first. Paid loans after, most recently settled first (`updatedAt`: the
 * last write to a paid loan is the repayment that settled it, or a later edit).
 */
export function sortLoans<T extends Pick<Loan, 'status' | 'dueDate' | 'loanDate' | 'updatedAt'>>(
  loans: readonly T[],
): { open: T[]; paid: T[] } {
  const open = loans.filter(isOpenLoan).sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    return a.loanDate.localeCompare(b.loanDate)
  })
  const paid = loans
    .filter(loan => !isOpenLoan(loan))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return { open, paid }
}

/** The open loan with the closest due date (overdue ones included), if any has one. */
export function nextDueLoan<T extends Pick<Loan, 'status' | 'dueDate' | 'loanDate' | 'updatedAt'>>(
  loans: readonly T[],
): T | undefined {
  return sortLoans(loans).open.find(loan => loan.dueDate)
}
