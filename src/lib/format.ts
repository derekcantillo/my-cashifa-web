import { APP_CURRENCY, APP_TIME_ZONE } from '@/config/app'
import i18n from '@/i18n'
import type { FinancialPeriod } from '@/types'

/** Dates are shown in Bogotá time, like the backend computes them. */
export { APP_TIME_ZONE }

const LOCALES: Record<string, string> = { es: 'es-CO', en: 'en-US' }
const DAY_MS = 24 * 60 * 60 * 1000

export function toLocale(language: string | undefined): string {
  return LOCALES[language ?? 'es'] ?? 'es-CO'
}

/**
 * Intl locale of the active UI language. Components that format should still
 * subscribe to language changes (`useTranslation`/`useFormatters`) so they re-render.
 */
export function activeLocale(): string {
  return toLocale(i18n.resolvedLanguage)
}

export interface MoneyFormatOptions {
  currency?: string
  /** `'exceptZero'` → "+$ 1.200" / "−$ 300"; `'never'` drops the sign (show it elsewhere). */
  signDisplay?: Intl.NumberFormatOptions['signDisplay']
  /** "$ 1,2 M" instead of "$ 1.200.000" — for tight spots and chart axes. */
  compact?: boolean
  /** Compact only: decimals allowed (default 1). */
  compactFractionDigits?: number
  /** Defaults to the active UI language. */
  locale?: string
}

function moneyFormatter(options: MoneyFormatOptions): Intl.NumberFormat {
  const {
    currency = APP_CURRENCY,
    signDisplay,
    compact = false,
    compactFractionDigits = 1,
    locale = activeLocale(),
  } = options
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    signDisplay,
    ...(compact
      ? { notation: 'compact', maximumFractionDigits: compactFractionDigits }
      : { maximumFractionDigits: 0 }),
  })
}

/** Money in `APP_CURRENCY`, no cents (COP), narrow symbol. */
export function formatMoney(value: number, options: MoneyFormatOptions = {}): string {
  return moneyFormatter(options).format(value)
}

/** Same as `formatMoney`, split into parts (e.g. to style the currency symbol on its own). */
export function formatMoneyParts(
  value: number,
  options: MoneyFormatOptions = {},
): Intl.NumberFormatPart[] {
  return moneyFormatter(options).formatToParts(value)
}

export interface PercentFormatOptions {
  maximumFractionDigits?: number
  signDisplay?: Intl.NumberFormatOptions['signDisplay']
  locale?: string
}

/** `value` is a ratio: 0.42 → "42 %" / "42%". */
export function formatPercent(value: number, options: PercentFormatOptions = {}): string {
  const { maximumFractionDigits = 0, signDisplay, locale = activeLocale() } = options
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
    signDisplay,
  }).format(value)
}

export type DateFormatOptions = Intl.DateTimeFormatOptions & { locale?: string }

/** Any instant formatted in Bogotá time (override with `timeZone`). Default: "21 sept 2026". */
export function formatDate(value: Date | string, options: DateFormatOptions = {}): string {
  const { locale = activeLocale(), timeZone = APP_TIME_ZONE, ...format } = options
  const date = typeof value === 'string' ? new Date(value) : value
  const hasFields = Object.keys(format).length > 0
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...(hasFields ? format : { day: 'numeric', month: 'short', year: 'numeric' }),
  }).format(date)
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
  period: Pick<FinancialPeriod, 'startDate' | 'endDate'>,
  locale: string = activeLocale(),
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
  const cleaned = value
    .replace(/[\s$]/g, '')
    .split(group)
    .join('')
    .replace(decimal, '.')
    // "12," while typing a decimal: treat as 12.
    .replace(/\.$/, '')
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : NaN
}

/** Inverse of `parseAmountInput`, for pre-filling the edit form ("1.450.000" in es). */
export function formatAmountInput(amount: number, locale: string): string {
  const { decimal } = separatorsOf(locale)
  const [integer, fraction] = String(Math.round(Math.abs(amount) * 100) / 100).split('.')
  return formatAmountTyping(fraction ? `${integer}${decimal}${fraction}` : integer, locale)
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
  return addDaysToDateKey(dateKey, -1)
}

/** Like `parseAmountInput` but accepts a leading "-" (a balance can be negative, e.g. a credit card). */
export function parseSignedAmountInput(value: string, locale: string): number {
  const trimmed = value.trim()
  const negative = trimmed.startsWith('-') || trimmed.startsWith('−')
  const amount = parseAmountInput(negative ? trimmed.slice(1) : trimmed, locale)
  return negative ? -amount : amount
}

/** Noon Bogotá of a `YYYY-MM-DD` day — safe to format in Bogotá without day drift. */
export function dateKeyToDate(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00-05:00`)
}

/** `YYYY-MM-DD` (Bogotá) `days` after `dateKey` (negative goes back). */
export function addDaysToDateKey(dateKey: string, days: number): string {
  return toDateInputValue(new Date(dateKeyToDate(dateKey).getTime() + days * DAY_MS))
}

/** Whole calendar days from `from` to `to` (both `YYYY-MM-DD`); 0 when equal. */
export function daysBetweenDateKeys(from: string, to: string): number {
  return Math.round((dateKeyToDate(to).getTime() - dateKeyToDate(from).getTime()) / DAY_MS)
}

function separatorsOf(locale: string): { group: string; decimal: string } {
  return locale.startsWith('es') ? { group: '.', decimal: ',' } : { group: ',', decimal: '.' }
}

/**
 * Live formatting of an amount being typed: keeps digits and one decimal mark (≤ 2
 * decimals) and regroups the integer part, so "1450000" reads "1.450.000" (es) or
 * "1,450,000" (en). Group marks typed by the user are dropped and recomputed; a trailing
 * decimal mark is kept so "12," can become "12,5". Never negative. Parse the result
 * with `parseAmountInput` — the only string → number conversion.
 */
export function formatAmountTyping(raw: string, locale: string): string {
  const { group, decimal } = separatorsOf(locale)
  let integer = ''
  let fraction: string | null = null
  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      if (fraction === null) integer += char
      else if (fraction.length < 2) fraction += char
    } else if (char === decimal && fraction === null) {
      fraction = ''
    }
  }
  integer = integer.replace(/^0+(?=\d)/, '')
  if (integer === '' && fraction !== null) integer = '0'
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return fraction === null ? grouped : `${grouped}${decimal}${fraction}`
}

/**
 * Where the caret goes after `formatAmountTyping`: right after the same number of
 * significant characters (digits and decimal mark) it had before reformatting.
 */
export function caretAfterTyping(
  raw: string,
  caret: number,
  formatted: string,
  locale: string,
): number {
  const { decimal } = separatorsOf(locale)
  const significant = (char: string) => (char >= '0' && char <= '9') || char === decimal
  let count = 0
  for (const char of raw.slice(0, caret)) if (significant(char)) count += 1
  if (count === 0) return 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (significant(formatted[index]) && --count === 0) return index + 1
  }
  return formatted.length
}

/** Currency symbol of `APP_CURRENCY` in the given locale ("$"). */
export function currencySymbol(locale: string = activeLocale()): string {
  return (
    formatMoneyParts(0, { locale }).find(part => part.type === 'currency')?.value ?? APP_CURRENCY
  )
}

/**
 * Whether an instant carries a real time of day. Movements logged for a past day are
 * pinned to exactly 12:00:00.000 Bogotá by `fromDateInputValue` (a placeholder, not a
 * time anyone chose), so those don't show a clock time.
 */
export function hasClockTime(iso: string): boolean {
  const date = new Date(iso)
  return !(
    date.getUTCHours() === 17 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

/** Time of day in Bogotá: "3:45 p. m." / "3:45 PM". */
export function formatTime(iso: string, locale: string = activeLocale()): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Compact "29 sept" / "Sep 29" in Bogotá — no "de", no trailing dot (chart labels). */
export function formatDayMonth(date: Date | string, locale: string = activeLocale()): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).formatToParts(typeof date === 'string' ? new Date(date) : date)
  const day = parts.find(part => part.type === 'day')?.value ?? ''
  const month = (parts.find(part => part.type === 'month')?.value ?? '').replace(/\.$/, '')
  const monthFirst =
    parts.findIndex(part => part.type === 'month') < parts.findIndex(part => part.type === 'day')
  return monthFirst ? `${month} ${day}` : `${day} ${month}`
}
