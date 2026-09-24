import { cn } from '@/lib/utils'

/** Placeholder block with the shape of the content that is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-ink/10', className)} />
}
