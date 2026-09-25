import type { ReactNode } from 'react'

interface SettingsSectionProps {
  id: string
  title: string
  description?: string
  /** Action shown next to the title (e.g. "+ Agregar"). */
  action?: ReactNode
  children: ReactNode
}

export function SettingsSection({
  id,
  title,
  description,
  action,
  children,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="max-w-xl text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-2">
        {children}
      </div>
    </section>
  )
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 sm:-mr-3"
    >
      <span aria-hidden>+</span>
      {label}
    </button>
  )
}
