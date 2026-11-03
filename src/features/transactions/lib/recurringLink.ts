import { formatAmountInput, parseAmountInput } from '@/lib/format'
import type { Category, RecurringExpense } from '@/types'

export interface LinkableFormState {
  /** Formatted amount text in the form ("" when empty). */
  amount: string
  category: Category | ''
  /** Whether the user typed the amount / picked the category themselves. */
  amountEditedByUser: boolean
  categoryEditedByUser: boolean
}

export interface LinkPatch {
  /** New amount text, or `undefined` to keep what the user typed. */
  amount: string | undefined
  /** Always the recurring expense's category: the backend rejects a mismatch. */
  category: Category
  /** The user had picked a different category and it was replaced. */
  categoryReplaced: boolean
}

/**
 * What linking a recurring expense changes in the form. Like the mobile prefill, it
 * fills the estimated amount and the category, but never overwrites an amount the
 * user typed. The category is forced (POST /transactions answers 400 when it differs
 * from the recurring expense's), and the caller tells the user when that replaced
 * their own pick.
 */
export function applyRecurringLink(
  state: LinkableFormState,
  recurring: Pick<RecurringExpense, 'category' | 'estimatedAmount'>,
  locale: string,
): LinkPatch {
  const keepAmount = state.amountEditedByUser && state.amount.trim() !== ''
  return {
    amount: keepAmount ? undefined : formatAmountInput(recurring.estimatedAmount, locale),
    category: recurring.category,
    categoryReplaced:
      state.categoryEditedByUser && state.category !== '' && state.category !== recurring.category,
  }
}

/**
 * Picking another category by hand drops the link (mobile `setCategoryId` does the
 * same): the movement no longer is that recurring expense.
 */
export function keepsLink(
  linked: Pick<RecurringExpense, 'category'> | undefined,
  category: Category | '',
): boolean {
  return linked !== undefined && linked.category === category
}

/**
 * Typed amount minus the estimate, or `null` when there's nothing to compare
 * (empty/invalid amount, or equal to the estimate).
 */
export function differenceFromEstimate(
  amountText: string,
  estimatedAmount: number,
  locale: string,
): number | null {
  const amount = parseAmountInput(amountText, locale)
  if (Number.isNaN(amount) || amount === estimatedAmount) return null
  return amount - estimatedAmount
}

/**
 * The `recurringExpenseId` part of a PATCH: only sent when the user changed the link.
 * `selected` is the form's value (`''` = none), so unlinking sends `null`.
 */
export function recurringLinkUpdate(
  original: string | null,
  selected: string,
): { recurringExpenseId?: string | null } {
  const next = selected === '' ? null : selected
  return next === original ? {} : { recurringExpenseId: next }
}

export interface RecurringOptions {
  /** Active and with nothing registered in the period: linkable. */
  pending: RecurringExpense[]
  /** Active but already registered in the period: shown disabled, like the mobile app
   *  (which only offers pending ones). */
  registered: RecurringExpense[]
}

export function groupRecurringOptions(
  all: readonly RecurringExpense[],
  pending: readonly RecurringExpense[],
): RecurringOptions {
  const pendingIds = new Set(pending.map(item => item.id))
  const byDay = (a: RecurringExpense, b: RecurringExpense) => a.dayOfMonth - b.dayOfMonth
  return {
    pending: [...pending].sort(byDay),
    registered: all.filter(item => item.active && !pendingIds.has(item.id)).sort(byDay),
  }
}
