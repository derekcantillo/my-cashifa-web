import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button, Enter } from '@/components/ui'
import { cn } from '@/lib/cn'

interface MasterDetailLayoutProps {
  /** Below `lg`: show the detail view instead of the list (an id is in the URL). */
  detailOpen: boolean
  backLabel: string
  onBack: () => void
  /** PageHeader. */
  header: ReactNode
  /** Replaces hero + list + detail (loading, error, empty). */
  body?: ReactNode
  hero?: ReactNode
  list?: ReactNode
  detail?: ReactNode
}

/**
 * List + detail screen (Metas, Préstamos). One tree for every width: from `lg` the list
 * (5 cols) and a sticky detail (7 cols) sit side by side; below it they are separate
 * views swapped with CSS (`max-lg:hidden`), so resizing never unmounts the page or
 * replays the entrance.
 */
export function MasterDetailLayout({
  detailOpen,
  backLabel,
  onBack,
  header,
  body,
  hero,
  list,
  detail,
}: MasterDetailLayoutProps) {
  const listView = detailOpen ? 'max-lg:hidden' : undefined
  const detailView = detailOpen ? undefined : 'max-lg:hidden'

  return (
    <div className="space-y-8">
      {detailOpen && (
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={onBack}
          className="-mb-3 -ml-3 lg:hidden"
        >
          {backLabel}
        </Button>
      )}

      <Enter order={0} className={listView}>
        {header}
      </Enter>

      {body ?? (
        <>
          {hero && (
            <Enter order={1} className={listView}>
              {hero}
            </Enter>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Enter order={2} className={cn('lg:col-span-5', listView)}>
              {list}
            </Enter>
            {detail && (
              <Enter order={3} className={cn('lg:col-span-7', detailView)}>
                {/* Stays in view under the topbar while the list scrolls. */}
                <div className="lg:sticky lg:top-20">{detail}</div>
              </Enter>
            )}
          </div>
        </>
      )}
    </div>
  )
}
