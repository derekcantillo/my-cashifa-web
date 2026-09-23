import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { Header } from './Header'
import { CONTENT_GUTTER } from './layoutStyles'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])

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
    </div>
  )
}
