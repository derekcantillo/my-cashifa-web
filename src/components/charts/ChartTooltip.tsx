interface ChartTooltipProps {
  active: boolean | undefined
  /** Date or category — shown muted. */
  label: string | undefined
  /** The formatted amount. */
  value: string | undefined
  /** Optional series name ("Proyección"), after the label. */
  series?: string
}

/** The one tooltip for every chart: floating surface, a label and an amount, no arrow. */
export function ChartTooltip({ active, label, value, series }: ChartTooltipProps) {
  if (!active || value === undefined) return null
  return (
    <div className="rounded-md bg-surface-raised px-3 py-2 text-body-sm shadow-floating">
      {label && (
        <p className="text-ink-muted">
          {label}
          {series && ` · ${series}`}
        </p>
      )}
      <p className="font-medium text-ink tabular-nums">{value}</p>
    </div>
  )
}
