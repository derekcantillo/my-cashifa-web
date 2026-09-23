import {
  Bell,
  ChartColumn,
  HandCoins,
  House,
  Receipt,
  Settings,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { ROUTES } from '@/lib/routes'

// TODO(Block 3): replace with the real unread count from the alerts API.
export const MOCK_UNREAD_ALERTS = 3

export type NavItemId =
  'dashboard' | 'transactions' | 'goals' | 'reports' | 'loans' | 'alerts' | 'netWorth' | 'settings'

export interface NavItem {
  id: NavItemId
  to: string
  icon: LucideIcon
  /** Unread count shown next to the label. */
  count?: number
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', to: ROUTES.dashboard, icon: House },
  { id: 'transactions', to: ROUTES.transactions, icon: Receipt },
  { id: 'goals', to: ROUTES.goals, icon: Target },
  { id: 'reports', to: ROUTES.reports, icon: ChartColumn },
  { id: 'loans', to: ROUTES.loans, icon: HandCoins },
  { id: 'alerts', to: ROUTES.alerts, icon: Bell, count: MOCK_UNREAD_ALERTS },
  { id: 'netWorth', to: ROUTES.netWorth, icon: TrendingUp },
  { id: 'settings', to: ROUTES.settings, icon: Settings },
]
