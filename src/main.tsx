import '@/i18n'
import '@/index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { LucideProvider } from 'lucide-react'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { queryClient } from '@/lib/queryClient'
import { ThemeProvider } from '@/theme'

// Loaded only in development; the branch is dropped from the production bundle.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then(module => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Icon defaults of the design system: 18px, 1.5 stroke. */}
        <LucideProvider size={18} strokeWidth={1.5}>
          <App />
        </LucideProvider>
      </ThemeProvider>
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
)
