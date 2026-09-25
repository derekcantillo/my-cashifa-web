import type { FinancialPeriod } from '@/types'

/** All amounts are COP; dates are shown in Bogotá time, like the backend computes them. */
const CURRENCY = 'COP'
export const APP_TIME_ZONE = 'America/Bogota'

const LOCALES: Record<string, string> = { es: 'es-CO', en: 'en-US' }
const DAY_MS = 24 * 60 * 60 * 1000

export function toLocale(language: string | undefined): string {
  return LOCALES[language ?? 'es'] ?? 'es-CO'
}

export function formatMoney(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Calendar day in Bogotá as a UTC-midnight timestamp, so day differences are exact. */
function bogotaDay(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return Date.parse(`${parts}T00:00:00Z`)
}

/** "hoy", "ayer", "hace 3 días", then a short date ("15 sept") after a week. */
export function formatRelativeDay(iso: string, locale: string, now = new Date()): string {
  const date = new Date(iso)
  const days = Math.round((bogotaDay(now) - bogotaDay(date)) / DAY_MS)
  if (days >= 0 && days < 7) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day')
  }
  return formatShortDate(iso, locale, now)
}

export function formatShortDate(iso: string, locale: string, now = new Date()): string {
  const date = new Date(iso)
  const year = new Intl.DateTimeFormat('en', { timeZone: APP_TIME_ZONE, year: 'numeric' })
  const sameYear = year.format(date) === year.format(now)
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/**
 * Localized period range. The backend `label` is Spanish-only, so the range is
 * rebuilt from the dates. `endDate` is exclusive: the last day is the one before.
 * Returns `end: null` for the open period.
 */
export function formatPeriodRange(
  period: FinancialPeriod,
  locale: string,
): { start: string; end: string | null; range: string | null } {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }
  const start = new Date(period.startDate)
  const formatter = new Intl.DateTimeFormat(locale, options)
  if (!period.endDate) return { start: formatter.format(start), end: null, range: null }
  const lastDay = new Date(Date.parse(period.endDate) - DAY_MS)
  return {
    start: formatter.format(start),
    end: formatter.format(lastDay),
    range: formatter.formatRange(start, lastDay),
  }
}

const DATE_KEY = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** `YYYY-MM-DD` of an instant in Bogotá — the value an `<input type="date">` expects. */
export function toDateInputValue(date: Date | string = new Date()): string {
  return DATE_KEY.format(typeof date === 'string' ? new Date(date) : date)
}

/**
 * Turns a date-input value into the ISO instant sent as `transactionDate`.
 * The backend does `new Date(value)`, so a bare `YYYY-MM-DD` would be UTC midnight —
 * 7 pm of the previous day in Bogotá, landing in the wrong day (or period).
 * Today keeps the current time (so it sorts after earlier movements); any other day
 * is pinned to noon Bogotá.
 */
export function fromDateInputValue(value: string, now = new Date()): string {
  if (value === toDateInputValue(now)) return now.toISOString()
  return new Date(`${value}T12:00:00-05:00`).toISOString()
}

/**
 * Parses an amount typed by the user. In Spanish (Colombia) `.` groups thousands and
 * `,` is the decimal mark ("48.000" is forty-eight thousand); in English it's the
 * other way round. Returns `NaN` when it isn't a valid amount with ≤ 2 decimals.
 */
export function parseAmountInput(value: string, locale: string): number {
  const [group, decimal] = locale.startsWith('es') ? ['.', ','] : [',', '.']
  const cleaned = value.replace(/[\s$]/g, '').split(group).join('').replace(decimal, '.')
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : NaN
}

/** Inverse of `parseAmountInput`, for pre-filling the edit form. */
export function formatAmountInput(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: true }).format(
    amount,
  )
}

/** Day heading for grouped lists, e.g. "domingo, 21 de septiembre". */
export function formatDayHeading(dateKey: string, locale: string, now = new Date()): string {
  const date = new Date(`${dateKey}T12:00:00-05:00`)
  const year = new Intl.DateTimeFormat('en', { timeZone: APP_TIME_ZONE, year: 'numeric' })
  const text = new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(year.format(date) === year.format(now) ? {} : { year: 'numeric' }),
  }).format(date)
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

/** `YYYY-MM-DD` (Bogotá) of the day before `dateKey`. */
export function previousDateKey(dateKey: string): string {
  return toDateInputValue(new Date(Date.parse(`${dateKey}T12:00:00-05:00`) - DAY_MS))
}

/** Like `parseAmountInput` but accepts a leading "-" (a balance can be negative, e.g. a credit card). */
export function parseSignedAmountInput(value: string, locale: string): number {
  const trimmed = value.trim()
  const negative = trimmed.startsWith('-') || trimmed.startsWith('−')
  const amount = parseAmountInput(negative ? trimmed.slice(1) : trimmed, locale)
  return negative ? -amount : amount
}
