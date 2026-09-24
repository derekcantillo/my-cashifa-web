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
