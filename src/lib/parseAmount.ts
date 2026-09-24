/**
 * Converts a serialized money value to `number`. The backend stores `Decimal(12,2)`
 * and currently sends JSON numbers, but a Decimal can also arrive as a string.
 *
 * Only call this in repository mappers — components and hooks receive numbers.
 * Throws on unparseable input so bad data fails loudly instead of rendering `NaN`.
 */
export function parseAmount(value: string | number): number {
  const amount = typeof value === 'number' ? value : value.trim() === '' ? NaN : Number(value)
  if (!Number.isFinite(amount)) {
    throw new TypeError(`parseAmount: invalid amount ${JSON.stringify(value)}`)
  }
  return amount
}
