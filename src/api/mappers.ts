import { FALLBACK_CATEGORY, isCategory, type Category } from '@/types'

/** A money field as it may arrive over the wire (Decimal serialized as number or string). */
export type RawAmount = number | string

/** Unknown categories (e.g. added to the backend enum before the web) fall back to OTHER. */
export function toCategory(raw: string): Category {
  return isCategory(raw) ? raw : FALLBACK_CATEGORY
}
