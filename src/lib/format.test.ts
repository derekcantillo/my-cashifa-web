import { describe, expect, it, vi } from 'vitest'

import {
  caretAfterTyping,
  formatAmountInput,
  formatAmountTyping,
  fromDateInputValue,
  parseAmountInput,
  toDateInputValue,
} from './format'

// format.ts reads the active language from the i18n instance; tests pass locales explicitly.
vi.mock('@/i18n', () => ({ default: { resolvedLanguage: 'es' } }))

describe('transactionDate in Bogotá time', () => {
  // 2026-10-01 10:30 in Bogotá (UTC−5).
  const now = new Date('2026-10-01T15:30:00.000Z')

  it('pins a past day to noon Bogotá, so it never slides to the previous day', () => {
    const iso = fromDateInputValue('2026-09-29', now)
    expect(iso).toBe('2026-09-29T17:00:00.000Z')
    expect(toDateInputValue(iso)).toBe('2026-09-29')
  })

  it('keeps the current instant for today', () => {
    expect(fromDateInputValue('2026-10-01', now)).toBe(now.toISOString())
  })

  it('reads "today" in Bogotá even when it is already tomorrow in UTC', () => {
    // 2026-10-01 22:00 Bogotá = 2026-10-02 03:00 UTC.
    const lateNight = new Date('2026-10-02T03:00:00.000Z')
    expect(toDateInputValue(lateNight)).toBe('2026-10-01')
    expect(fromDateInputValue('2026-10-01', lateNight)).toBe(lateNight.toISOString())
  })

  it('a salary on the first day of a period stays on that day', () => {
    // Periods start at Bogotá midnight (05:00Z). Noon is safely inside the same day.
    const iso = fromDateInputValue('2026-09-29', now)
    expect(Date.parse(iso)).toBeGreaterThanOrEqual(Date.parse('2026-09-29T05:00:00.000Z'))
    expect(Date.parse(iso)).toBeLessThan(Date.parse('2026-09-30T05:00:00.000Z'))
  })
})

describe('amount typing', () => {
  it('groups thousands as you type (es-CO)', () => {
    expect(formatAmountTyping('1450000', 'es-CO')).toBe('1.450.000')
    expect(formatAmountTyping('1.4500', 'es-CO')).toBe('14.500')
    expect(formatAmountTyping('48000,5', 'es-CO')).toBe('48.000,5')
    expect(formatAmountTyping('12,', 'es-CO')).toBe('12,')
    expect(formatAmountTyping('12,345', 'es-CO')).toBe('12,34')
  })

  it('groups thousands as you type (en-US)', () => {
    expect(formatAmountTyping('1450000', 'en-US')).toBe('1,450,000')
    expect(formatAmountTyping('48000.5', 'en-US')).toBe('48,000.5')
  })

  it('drops anything that is not a positive amount', () => {
    expect(formatAmountTyping('-$ 3a0', 'es-CO')).toBe('30')
    expect(formatAmountTyping('007', 'es-CO')).toBe('7')
    expect(formatAmountTyping(',5', 'es-CO')).toBe('0,5')
    expect(formatAmountTyping('', 'es-CO')).toBe('')
  })

  it('keeps the caret after the same digit', () => {
    // Typed "5" after "1450" in "1450|000": the caret lands after "1.450.5" → index 7.
    const raw = '14505000'
    const formatted = formatAmountTyping(raw, 'es-CO')
    expect(formatted).toBe('14.505.000')
    expect(caretAfterTyping(raw, 5, formatted, 'es-CO')).toBe(6)
  })
})

describe('amount conversion (the single string → number helper)', () => {
  it('parses what the field shows', () => {
    expect(parseAmountInput('1.450.000', 'es-CO')).toBe(1450000)
    expect(parseAmountInput('48.000,5', 'es-CO')).toBe(48000.5)
    expect(parseAmountInput('1,450,000.25', 'en-US')).toBe(1450000.25)
    expect(parseAmountInput('12,', 'es-CO')).toBe(12)
  })

  it('rejects invalid input', () => {
    expect(parseAmountInput('', 'es-CO')).toBeNaN()
    expect(parseAmountInput('1,234', 'es-CO')).toBeNaN()
  })

  it('round-trips with formatAmountInput', () => {
    for (const amount of [0.5, 7, 1450, 48000.5, 1450000, 9339050]) {
      for (const locale of ['es-CO', 'en-US']) {
        expect(parseAmountInput(formatAmountInput(amount, locale), locale)).toBe(amount)
      }
    }
    expect(formatAmountInput(1450, 'es-CO')).toBe('1.450')
  })
})
