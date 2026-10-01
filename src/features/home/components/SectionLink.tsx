import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SectionLinkProps {
  to: string
  children: string
}

/** "Ver todos →" at the edge of a card. */
export function SectionLink({ to, children }: SectionLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-sm text-body-sm font-medium text-accent underline-offset-4 transition-tactile hover:underline"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  )
}
