import { describe, expect, it, vi } from 'vitest'

import type { RecurringExpense } from '@/types'

import { categoriesForType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categoriesByType'
import {
  applyRecurringLink,
  differenceFromEstimate,
  groupRecurringOptions,
  keepsLink,
  recurringLinkUpdate,
} from './recurringLink'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const rent: RecurringExpense = {
  id: 'rent',
  name: 'Arriendo',
  category: 'HOUSING',
  estimatedAmount: 1650000,
  isAmountFixed: true,
  dayOfMonth: 5,
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const empty = {
  amount: '',
  category: '' as const,
  amountEditedByUser: false,
  categoryEditedByUser: false,
}

describe('applyRecurringLink (autofill)', () => {
  it('fills the estimated amount and the category of an untouched form', () => {
    expect(applyRecurringLink(empty, rent, 'es-CO')).toEqual({
      amount: '1.650.000',
      category: 'HOUSING',
      categoryReplaced: false,
    })
  })

  it('never overwrites an amount the user typed', () => {
    const patch = applyRecurringLink(
      { ...empty, amount: '1.700.000', amountEditedByUser: true },
      rent,
      'es-CO',
    )
    expect(patch.amount).toBeUndefined()
  })

  it('refills an amount the user typed and then cleared', () => {
    const patch = applyRecurringLink(
      { ...empty, amount: ' ', amountEditedByUser: true },
      rent,
      'es-CO',
    )
    expect(patch.amount).toBe('1.650.000')
  })

  it('replaces a different category the user picked — and says so', () => {
    const patch = applyRecurringLink(
      { ...empty, category: 'FOOD', categoryEditedByUser: true },
      rent,
      'es-CO',
    )
    expect(patch).toMatchObject({ category: 'HOUSING', categoryReplaced: true })
  })

  it('does not flag a category that already matched', () => {
    const patch = applyRecurringLink(
      { ...empty, category: 'HOUSING', categoryEditedByUser: true },
      rent,
      'es-CO',
    )
    expect(patch.categoryReplaced).toBe(false)
  })

  it('formats the estimate in the active language', () => {
    expect(applyRecurringLink(empty, rent, 'en-US').amount).toBe('1,650,000')
  })
})

describe('link helpers', () => {
  it('a different category drops the link', () => {
    expect(keepsLink(rent, 'HOUSING')).toBe(true)
    expect(keepsLink(rent, 'FOOD')).toBe(false)
    expect(keepsLink(undefined, 'HOUSING')).toBe(false)
  })

  it('reports the difference with the estimate', () => {
    expect(differenceFromEstimate('1.700.000', 1650000, 'es-CO')).toBe(50000)
    expect(differenceFromEstimate('1.600.000', 1650000, 'es-CO')).toBe(-50000)
    expect(differenceFromEstimate('1.650.000', 1650000, 'es-CO')).toBeNull()
    expect(differenceFromEstimate('', 1650000, 'es-CO')).toBeNull()
  })

  it('groups pending first and registered (active only) after, by due day', () => {
    const phone = { ...rent, id: 'phone', dayOfMonth: 2 }
    const gym = { ...rent, id: 'gym', dayOfMonth: 1 }
    const paused = { ...rent, id: 'paused', active: false }
    const options = groupRecurringOptions([rent, phone, gym, paused], [rent, gym])
    expect(options.pending.map(item => item.id)).toEqual(['gym', 'rent'])
    expect(options.registered.map(item => item.id)).toEqual(['phone'])
    expect(options.current).toBeUndefined()
  })

  it('offers the current link on its own, out of the registered group', () => {
    const phone = { ...rent, id: 'phone', dayOfMonth: 2 }
    const gym = { ...rent, id: 'gym', dayOfMonth: 1 }
    // `phone` is linked to the edited movement, so it's registered in the period.
    const options = groupRecurringOptions([rent, phone, gym], [rent, gym], 'phone')
    expect(options.current?.id).toBe('phone')
    expect(options.registered.map(item => item.id)).toEqual([])
    expect(options.pending.map(item => item.id)).toEqual(['gym', 'rent'])
  })

  it('keeps the current link out of pending too (e.g. after moving the date)', () => {
    const options = groupRecurringOptions([rent], [rent], 'rent')
    expect(options.current?.id).toBe('rent')
    expect(options.pending).toEqual([])
  })

  it('still offers a current link that is no longer active', () => {
    const paused = { ...rent, id: 'paused', active: false }
    const options = groupRecurringOptions([rent, paused], [rent], 'paused')
    expect(options.current?.id).toBe('paused')
  })
})

describe('categories by type', () => {
  it('expense offers neither Salary nor Loan; income offers Salary', () => {
    expect(categoriesForType('EXPENSE')).not.toContain('SALARY')
    expect(categoriesForType('EXPENSE')).not.toContain('LOAN')
    expect(categoriesForType('EXPENSE')).not.toContain('SAVING')
    expect(categoriesForType('INCOME')).toContain('SALARY')
    expect(categoriesForType('INCOME')).not.toContain('LOAN')
    expect(EXPENSE_CATEGORIES).toHaveLength(13)
    expect(INCOME_CATEGORIES).toEqual(['SALARY', 'OTHER'])
  })

  it('keeps the current category of an edited movement', () => {
    expect(categoriesForType('EXPENSE', 'SALARY')).toContain('SALARY')
    expect(categoriesForType('LOAN_REPAYMENT', 'LOAN')).toEqual(['LOAN'])
  })
})

describe('recurringLinkUpdate (PATCH)', () => {
  it('sends nothing when the link did not change', () => {
    expect(recurringLinkUpdate('rent', 'rent')).toEqual({})
    expect(recurringLinkUpdate(null, '')).toEqual({})
  })

  it('sends the id to link an unlinked movement', () => {
    expect(recurringLinkUpdate(null, 'rent')).toEqual({ recurringExpenseId: 'rent' })
  })

  it('sends null to unlink', () => {
    expect(recurringLinkUpdate('rent', '')).toEqual({ recurringExpenseId: null })
  })

  it('sends the new id when switching to another recurring expense', () => {
    expect(recurringLinkUpdate('rent', 'internet')).toEqual({ recurringExpenseId: 'internet' })
  })
})
