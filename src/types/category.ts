// Mirrors the backend `Category` enum (prisma/schema.prisma), in the mobile app's display order.
export const CATEGORIES = [
  'FOOD',
  'TRANSPORT',
  'ENTERTAINMENT',
  'SERVICES',
  'DEBT',
  'HOUSING',
  'VEHICLE',
  'HEALTH',
  'SAVING',
  'SALARY',
  'CONTINGENCY',
  'LOAN',
  'EDUCATION',
  'TAXES',
  'PERSONAL',
  'OTHER',
] as const

export type Category = (typeof CATEGORIES)[number]

/** Where an unknown value lands (e.g. a category added to the backend before the web). */
export const FALLBACK_CATEGORY: Category = 'OTHER'

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}
