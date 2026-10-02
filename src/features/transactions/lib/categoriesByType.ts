import type { Category, TransactionType } from '@/types'

/**
 * Categories offered for each movement type — the same split as the mobile app
 * (`categoryMapper.ts`, `kinds`): SALARY is income only, SAVING belongs to savings,
 * and LOAN is never picked by hand (loans have their own flows).
 */
export const EXPENSE_CATEGORIES: readonly Category[] = [
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'SERVICES',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'PERSONAL',
  'VEHICLE',
  'DEBT',
  'TAXES',
  'CONTINGENCY',
  'OTHER',
]

export const INCOME_CATEGORIES: readonly Category[] = ['SALARY', 'OTHER']

/** The two types this form can create or switch between. */
export const FORM_TYPES = ['EXPENSE', 'INCOME'] as const
export type FormType = (typeof FORM_TYPES)[number]

export function isFormType(type: TransactionType): type is FormType {
  return (FORM_TYPES as readonly string[]).includes(type)
}

/**
 * Categories to offer for `type`. When editing, the movement's current category is
 * always kept (an old expense filed under SALARY must stay valid). Types the form
 * can't change (savings, loans, debt payments) only show their own category.
 */
export function categoriesForType(type: TransactionType, current?: Category): readonly Category[] {
  if (!isFormType(type)) return current ? [current] : []
  const base = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  return current && !base.includes(current) ? [...base, current] : base
}
