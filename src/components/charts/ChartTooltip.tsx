interface ChartTooltipProps {
  active: boolean | undefined
  /** Date or category — shown muted. */
  label: string | undefined
  /** The formatted amount. */
  value: string | undefined
}

/** The one tooltip shape for every chart: a label and an amount, nothing else. */
export function ChartTooltip({ active, label, value }: ChartTooltipProps) {
  if (!active || value === undefined) return null
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm shadow-sm">
      {label && <p className="text-ink-muted">{label}</p>}
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}
