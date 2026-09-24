import { lazy, Suspense, useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ToastContainer } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { Header } from './Header'
import { CONTENT_GUTTER } from './layoutStyles'
import { Sidebar } from './Sidebar'

// Loaded on first open, so the form stack (react-hook-form, zod) stays out of the main bundle.
const TransactionFormModal = lazy(() =>
  import('@/features/transactions/components/TransactionFormModal').then(module => ({
    default: module.TransactionFormModal,
  })),
)

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const isTransactionModalOpen = useTransactionModalStore(state => state.isOpen)

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <Sidebar open={navOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header navOpen={navOpen} onOpenNav={() => setNavOpen(true)} />
        <main className={cn(CONTENT_GUTTER, 'flex-1 py-8 lg:py-12')}>
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Remounts on every open, so each open starts from a fresh form. */}
      {isTransactionModalOpen && (
        <Suspense fallback={null}>
          <TransactionFormModal />
        </Suspense>
      )}

      <ToastContainer />
    </div>
  )
}
