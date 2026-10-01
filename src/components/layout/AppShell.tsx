import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ToastContainer } from '@/components/ui'
import { useTransactionModalStore } from '@/store/transactionModalStore'

import { GlobalModals } from './GlobalModals'
import { PageContainer } from './PageContainer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/**
 * Fixed 248px sidebar + content column. Below `lg` the sidebar becomes an
 * off-canvas drawer opened from the topbar.
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const openTransactionModal = useTransactionModalStore(state => state.open)

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar open={navOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          navOpen={navOpen}
          onOpenNav={() => setNavOpen(true)}
          // The transaction form opens as an expense by default.
          onRegisterExpense={() => openTransactionModal('create')}
        />
        <main className="flex-1">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>

      <GlobalModals />

      <ToastContainer />
    </div>
  )
}
