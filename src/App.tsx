import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { RequireApiKey } from '@/components/layout'
import { ROUTES } from '@/lib/routes'

// Screens are lazy-loaded so each route ships in its own chunk.
const router = createBrowserRouter([
  {
    // Rendered while the first matched route's chunk loads.
    hydrateFallbackElement: <div className="min-h-screen" />,
    children: [
      {
        path: ROUTES.setup,
        lazy: async () => ({ Component: (await import('@/features/auth')).ApiKeySetupScreen }),
      },
      {
        element: <RequireApiKey />,
        children: [
          {
            path: ROUTES.home,
            lazy: async () => ({
              Component: (await import('@/features/dashboard')).DashboardPlaceholder,
            }),
          },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
