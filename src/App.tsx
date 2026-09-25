import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AppLayout, RequireApiKey } from '@/components/layout'
import { ROUTES } from '@/lib/routes'

/** Lazy route loader: each screen ships in its own chunk. */
function lazyScreen<TModule>(
  load: () => Promise<TModule>,
  pick: (module: TModule) => ComponentType,
) {
  return async () => ({ Component: pick(await load()) })
}

const router = createBrowserRouter([
  {
    // Rendered while the first matched route's chunk loads.
    hydrateFallbackElement: <div className="min-h-screen bg-surface" />,
    children: [
      {
        path: ROUTES.setup,
        lazy: lazyScreen(
          () => import('@/features/auth'),
          m => m.ApiKeySetupScreen,
        ),
      },
      {
        element: <RequireApiKey />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: ROUTES.dashboard,
                lazy: lazyScreen(
                  () => import('@/features/dashboard'),
                  m => m.DashboardPage,
                ),
              },
              {
                path: ROUTES.transactions,
                lazy: lazyScreen(
                  () => import('@/features/transactions'),
                  m => m.TransactionsPage,
                ),
              },
              {
                path: ROUTES.goals,
                lazy: lazyScreen(
                  () => import('@/features/goals/GoalsPage'),
                  m => m.GoalsPage,
                ),
              },
              {
                path: ROUTES.goalDetail,
                // Own chunk: only the detail page needs Recharts.
                lazy: lazyScreen(
                  () => import('@/features/goals/GoalDetailPage'),
                  m => m.GoalDetailPage,
                ),
              },
              {
                path: ROUTES.reports,
                lazy: lazyScreen(
                  () => import('@/features/reports'),
                  m => m.ReportsPage,
                ),
              },
              {
                path: ROUTES.loans,
                lazy: lazyScreen(
                  () => import('@/features/loans/LoansPage'),
                  m => m.LoansPage,
                ),
              },
              {
                path: ROUTES.loanDetail,
                lazy: lazyScreen(
                  () => import('@/features/loans/LoanDetailPage'),
                  m => m.LoanDetailPage,
                ),
              },
              {
                path: ROUTES.alerts,
                lazy: lazyScreen(
                  () => import('@/features/alerts'),
                  m => m.AlertsPage,
                ),
              },
              {
                path: ROUTES.netWorth,
                lazy: lazyScreen(
                  () => import('@/features/net-worth'),
                  m => m.NetWorthPage,
                ),
              },
              {
                path: ROUTES.settings,
                lazy: lazyScreen(
                  () => import('@/features/settings'),
                  m => m.SettingsPage,
                ),
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
