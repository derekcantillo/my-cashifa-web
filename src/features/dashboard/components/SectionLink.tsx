import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SectionLinkProps {
  to: string
  children: string
}

export function SectionLink({ to, children }: SectionLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
    >
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  )
}
