import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Content column: 1240px max, 32px gutters (16px on phones), 28px vertical rhythm. */
export const PAGE_GUTTER = 'mx-auto w-full max-w-[1240px] px-4 sm:px-8'

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(PAGE_GUTTER, 'py-7', className)}>{children}</div>
}
