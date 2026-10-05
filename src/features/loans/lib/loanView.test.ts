import i18next from 'i18next'
import { describe, expect, it, vi } from 'vitest'

import en from '@/i18n/locales/en/loans.json'
import es from '@/i18n/locales/es/loans.json'
import { formatMoney, fromDateInputValue, toDateInputValue } from '@/lib/format'
import { displayPercent, progressPercent } from '@/lib/goalMath'

import type { Loan } from '@/types'

import { defaultLoan, groupLoans, isOverdue, reminderText } from './loanView'

vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

const loan = (patch: Partial<Loan> & Pick<Loan, 'id'>): Loan => ({
  borrowerName: patch.id,
  amount: 1000,
  amountRepaid: 0,
  remainingAmount: 1000,
  status: 'ACTIVE',
  loanDate: '2026-07-01T17:00:00.000Z',
  dueDate: null,
  note: null,
  accountId: null,
  createdAt: '2026-07-01T17:00:00.000Z',
  updatedAt: '2026-07-01T17:00:00.000Z',
  ...patch,
})

describe('loan selection', () => {
  it('defaults to the first open loan', () => {
    const groups = groupLoans([
      loan({ id: 'paid', status: 'PAID', remainingAmount: 0 }),
      loan({ id: 'open' }),
    ])
    expect(defaultLoan(groups)?.id).toBe('open')
  })

  it('with nothing owed, defaults to the most recently paid loan', () => {
    const groups = groupLoans([
      loan({ id: 'old', status: 'PAID', updatedAt: '2026-08-01T00:00:00Z' }),
      loan({ id: 'recent', status: 'PAID', updatedAt: '2026-10-01T18:34:23Z' }),
    ])
    expect(defaultLoan(groups)?.id).toBe('recent')
    expect(defaultLoan(groupLoans([]))).toBeUndefined()
  })
})

describe('overdue (Bogotá day)', () => {
  const now = new Date('2026-10-02T15:00:00.000Z')
  it('is overdue only after the due day, and never once paid', () => {
    expect(isOverdue(loan({ id: 'a', dueDate: '2026-10-01T17:00:00Z' }), now)).toBe(true)
    expect(isOverdue(loan({ id: 'b', dueDate: '2026-10-02T17:00:00Z' }), now)).toBe(false)
    expect(isOverdue(loan({ id: 'c', dueDate: '2026-10-01T17:00:00Z', status: 'PAID' }), now)).toBe(
      false,
    )
    expect(isOverdue(loan({ id: 'd' }), now)).toBe(false)
  })
})

describe('pending balance and progress', () => {
  it('clamps an overpaid loan to 100% and never shows a negative balance', () => {
    // POST /repayments doesn't stop overpayment: remainingAmount can go below 0.
    const overpaid = loan({
      id: 'o',
      amount: 1000,
      amountRepaid: 1200,
      remainingAmount: -200,
      status: 'PAID',
    })
    expect(progressPercent(overpaid.amountRepaid, overpaid.amount)).toBe(100)
    expect(displayPercent(999, 1000)).toBe(99)
    expect(Math.max(0, overpaid.remainingAmount)).toBe(0)
  })
})

describe('reminder text', () => {
  const instance = i18next.createInstance()
  void instance.init({
    resources: { es: { loans: es }, en: { loans: en } },
    lng: 'es',
    defaultNS: 'loans',
    initAsync: false,
  })

  it('is localized, with the amount formatted for the language', () => {
    const subject = loan({ id: 'a', borrowerName: 'Ana', remainingAmount: 500000 })
    const es = reminderText(instance.getFixedT('es', 'loans'), subject, amount =>
      formatMoney(amount, { locale: 'es-CO' }),
    )
    expect(es.replace(/\u00a0/g, ' ')).toBe(
      'Hola Ana, te recuerdo el saldo pendiente de $ 500.000. ¡Gracias!',
    )
    const en = reminderText(instance.getFixedT('en', 'loans'), subject, amount =>
      formatMoney(amount, { locale: 'en-US' }),
    )
    expect(en).toBe('Hi Ana, a friendly reminder of the pending balance of $500,000. Thanks!')
  })
})

describe('repayment date', () => {
  it('a past day is sent as noon Bogotá and reads back as the same day', () => {
    const now = new Date('2026-10-02T15:00:00.000Z')
    const paidAt = fromDateInputValue('2026-09-25', now)
    expect(paidAt).toBe('2026-09-25T17:00:00.000Z')
    expect(toDateInputValue(paidAt)).toBe('2026-09-25')
  })
})
