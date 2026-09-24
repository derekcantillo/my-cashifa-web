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

import type { AlertType } from '@/types'

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
export function getAlertIcon(type: AlertType | string): LucideIcon {
  return ALERT_ICONS[type as AlertType] ?? Bell
}

/** Renders the icon for an alert type (a component, so callers don't pick one mid-render). */
export function AlertTypeIcon({ type, className }: { type: AlertType; className?: string }) {
  return createElement(getAlertIcon(type), { className, 'aria-hidden': true })
}
