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

export type NavItemId =
  'dashboard' | 'transactions' | 'goals' | 'reports' | 'loans' | 'alerts' | 'netWorth' | 'settings'

export interface NavItem {
  id: NavItemId
  to: string
  icon: LucideIcon
  /** Shows the unread-alerts count next to the label. */
  showsUnreadAlerts?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', to: ROUTES.dashboard, icon: House },
  { id: 'transactions', to: ROUTES.transactions, icon: Receipt },
  { id: 'goals', to: ROUTES.goals, icon: Target },
  { id: 'reports', to: ROUTES.reports, icon: ChartColumn },
  { id: 'loans', to: ROUTES.loans, icon: HandCoins },
  { id: 'alerts', to: ROUTES.alerts, icon: Bell, showsUnreadAlerts: true },
  { id: 'netWorth', to: ROUTES.netWorth, icon: TrendingUp },
  { id: 'settings', to: ROUTES.settings, icon: Settings },
]
