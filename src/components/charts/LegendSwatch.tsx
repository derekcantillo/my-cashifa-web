import { PROJECTION_DASH } from './chartTheme'

export function LegendSwatch({
  label,
  color,
  dashed = false,
}: {
  label: string
  color: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="20" height="4" aria-hidden>
        <line
          x1="0"
          y1="2"
          x2="20"
          y2="2"
          strokeWidth="2"
          stroke={color}
          strokeDasharray={dashed ? PROJECTION_DASH : undefined}
        />
      </svg>
      {label}
    </span>
  )
}
