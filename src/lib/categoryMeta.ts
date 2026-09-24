import {
  Banknote,
  Bus,
  Car,
  CreditCard,
  Gamepad2,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  ShoppingBag,
  Umbrella,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { Category } from '@/types'

export interface CategoryMeta {
  icon: LucideIcon
  /**
   * Label in the `categories` i18n namespace. The component must load it for the key to
   * type-check: `const { t } = useTranslation(['categories'])` then `t(meta.translationKey)`.
   */
  translationKey: `categories:${Category}`
  /** CSS color from src/theme/tokens.css, usable in `style` or as a chart `fill`. */
  color: string
}

function meta(category: Category, icon: LucideIcon): CategoryMeta {
  const token = category.toLowerCase().replace(/_/g, '-')
  return { icon, translationKey: `categories:${category}`, color: `var(--category-${token})` }
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  FOOD: meta('FOOD', UtensilsCrossed),
  TRANSPORT: meta('TRANSPORT', Bus),
  ENTERTAINMENT: meta('ENTERTAINMENT', Gamepad2),
  SERVICES: meta('SERVICES', Zap),
  DEBT: meta('DEBT', CreditCard),
  HOUSING: meta('HOUSING', House),
  VEHICLE: meta('VEHICLE', Car),
  HEALTH: meta('HEALTH', HeartPulse),
  SAVING: meta('SAVING', PiggyBank),
  SALARY: meta('SALARY', Banknote),
  CONTINGENCY: meta('CONTINGENCY', Umbrella),
  LOAN: meta('LOAN', HandCoins),
  EDUCATION: meta('EDUCATION', GraduationCap),
  TAXES: meta('TAXES', Landmark),
  PERSONAL: meta('PERSONAL', ShoppingBag),
  OTHER: meta('OTHER', Wallet),
}
