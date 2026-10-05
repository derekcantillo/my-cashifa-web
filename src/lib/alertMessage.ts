/**
 * The backend's `AlertsService.createOnce` stores every alert message as
 * `[dedupeKey] message` (the key is how it avoids duplicates — there's no reference
 * column). The key is technical noise for a person. Shapes seen in real data:
 *   [<periodCuid>:<expenseCuid>]   RECURRING_EXPENSE_DUE
 *   [<periodCuid>]                 SAVINGS_TARGET_AT_RISK / PERIOD_DEFICIT
 *   [YYYY-MM]                      legacy, before financial periods
 *   [YYYY-MM:<expenseCuid>]        legacy RECURRING_EXPENSE_DUE
 * A cuid is lowercase letters and digits, 20–30 characters.
 */
const CUID = '[a-z0-9]{20,30}'
const MONTH = '\\d{4}-(?:0[1-9]|1[0-2])'
const DEDUPE_PREFIX = new RegExp(`^\\[(?:${CUID}|${MONTH})(?::${CUID})?\\]\\s*`)
const RECURRING_KEY = new RegExp(`^\\[(${CUID}):(${CUID})\\]`)

/**
 * Removes only a leading dedupe-key prefix of the shapes above (and the space after
 * it). Any other bracket ("[Nota] …") is left alone. Never returns an empty string.
 */
export function cleanAlertMessage(message: string): string {
  const cleaned = message.replace(DEDUPE_PREFIX, '')
  return cleaned.trim() === '' ? message : cleaned
}

/**
 * The exact references inside a current RECURRING_EXPENSE_DUE key (`[period:expense]`,
 * both cuids). `null` for anything else — including the legacy `[YYYY-MM:expense]`,
 * whose period can't be identified exactly.
 */
export function parseRecurringAlertKey(
  message: string,
): { periodId: string; recurringExpenseId: string } | null {
  const match = RECURRING_KEY.exec(message)
  return match ? { periodId: match[1], recurringExpenseId: match[2] } : null
}
