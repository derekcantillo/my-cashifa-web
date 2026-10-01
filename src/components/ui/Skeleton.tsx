import { cn } from '@/lib/cn'

/** Placeholder block with the shape of the content that is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-sm bg-surface-sunken', className)} />
}
