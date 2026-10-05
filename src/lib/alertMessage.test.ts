import { describe, expect, it } from 'vitest'

import { cleanAlertMessage, parseRecurringAlertKey } from './alertMessage'

const PERIOD = 'cmuo5t68d010do701243733aj'
const EXPENSE = 'cmu77emvn007rph01sovpv1a1'

describe('cleanAlertMessage', () => {
  it('removes the four real prefix shapes', () => {
    expect(cleanAlertMessage(`[${PERIOD}:${EXPENSE}] Ayuda a mis papás: pago estimado`)).toBe(
      'Ayuda a mis papás: pago estimado',
    )
    expect(cleanAlertMessage('[cmu7knksn0003r9lqh267j75t] Tus metas activas requieren')).toBe(
      'Tus metas activas requieren',
    )
    expect(cleanAlertMessage('[2026-08] Tus metas activas')).toBe('Tus metas activas')
    expect(cleanAlertMessage('[2026-09:cmu74iq1h002dph01fhie6k5q] Gas: pago')).toBe('Gas: pago')
  })

  it('leaves legitimate brackets and plain messages alone', () => {
    expect(cleanAlertMessage('[Nota] revisa esto')).toBe('[Nota] revisa esto')
    expect(cleanAlertMessage('Gasto [extra] alto')).toBe('Gasto [extra] alto')
    expect(cleanAlertMessage('Sin prefijo')).toBe('Sin prefijo')
  })

  it('does not touch malformed prefixes', () => {
    expect(cleanAlertMessage('[2026-13] mes inválido')).toBe('[2026-13] mes inválido')
    expect(cleanAlertMessage('[CMUO5T68D010DO701243733AJ] mayúsculas')).toBe(
      '[CMUO5T68D010DO701243733AJ] mayúsculas',
    )
    expect(cleanAlertMessage('[abc] corto')).toBe('[abc] corto')
    expect(cleanAlertMessage(`[${PERIOD}:] vacío`)).toBe(`[${PERIOD}:] vacío`)
    expect(cleanAlertMessage(` [${PERIOD}] espacio antes`)).toBe(` [${PERIOD}] espacio antes`)
  })

  it('never returns an empty message', () => {
    expect(cleanAlertMessage('')).toBe('')
    expect(cleanAlertMessage(`[${PERIOD}]`)).toBe(`[${PERIOD}]`)
    expect(cleanAlertMessage(`[${PERIOD}]   `)).toBe(`[${PERIOD}]   `)
  })
})

describe('parseRecurringAlertKey', () => {
  it('reads both cuids of a current key', () => {
    expect(parseRecurringAlertKey(`[${PERIOD}:${EXPENSE}] Ayuda`)).toEqual({
      periodId: PERIOD,
      recurringExpenseId: EXPENSE,
    })
  })

  it('rejects the legacy month key and anything else', () => {
    expect(parseRecurringAlertKey(`[2026-09:${EXPENSE}] Gas`)).toBeNull()
    expect(parseRecurringAlertKey(`[${PERIOD}] Tus metas`)).toBeNull()
    expect(parseRecurringAlertKey(`Ayuda [${PERIOD}:${EXPENSE}]`)).toBeNull()
    expect(parseRecurringAlertKey(`[${PERIOD}:Gas] x`)).toBeNull()
  })
})
