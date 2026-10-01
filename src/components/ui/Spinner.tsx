import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/cn'

/** Decorative: announce the busy state on the owning control (`aria-busy`). */
export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn('size-4 animate-spin', className)} />
}
