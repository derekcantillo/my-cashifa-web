import { createElement } from 'react'
import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  Gauge,
  PiggyBank,
  Receipt,
  Target,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { ALERT_TYPES, type AlertType } from '@/types'

// Mirrors the backend `AlertType` enum (prisma/schema.prisma).
const ALERT_ICONS: Record<AlertType, LucideIcon> = {
  BUDGET_70: Gauge,
  BUDGET_90: Gauge,
  BUDGET_100: Gauge,
  LARGE_EXPENSE: Receipt,
  SAVING_REMINDER: PiggyBank,
  WEEKLY_SUMMARY: CalendarDays,
  MONTHLY_REPORT: ChartColumn,
  GOAL_PROGRESS: Target,
  RECURRING_EXPENSE_DUE: CalendarClock,
  SAVINGS_TARGET_AT_RISK: TriangleAlert,
  PERIOD_DEFICIT: TriangleAlert,
}

/** Falls back to a bell for a type the backend adds before the web knows it. */
export function getAlertIcon(type: string): LucideIcon {
  return isKnownAlertType(type) ? ALERT_ICONS[type] : Bell
}

/**
 * Types that express a real risk get the `warning` tone on their icon; every other
 * icon stays neutral (ink-muted). Color carries meaning only here.
 */
const RISK_TYPES: readonly AlertType[] = ['SAVINGS_TARGET_AT_RISK', 'PERIOD_DEFICIT', 'BUDGET_100']

export function isRiskAlert(type: string): boolean {
  return (RISK_TYPES as readonly string[]).includes(type)
}

export function isKnownAlertType(type: string): type is AlertType {
  return (ALERT_TYPES as readonly string[]).includes(type)
}

/** Renders the icon for an alert type (a component, so callers don't pick one mid-render). */
export function AlertTypeIcon({ type, className }: { type: string; className?: string }) {
  return createElement(getAlertIcon(type), { className, 'aria-hidden': true })
}
