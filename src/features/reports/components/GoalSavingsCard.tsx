import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ACTIVE_DOT,
  AREA_FILL,
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  ChartTooltip,
  CURSOR,
  GRID,
  LINE_WIDTH,
  monthTickLabel,
  moneyTickLabels,
  niceTicks,
  PROJECTION_DASH,
  tooltipDateFormat,
} from '@/components/charts'
import { Card, CardHeader, SectionError, Skeleton } from '@/components/ui'
import { useFormatters, useSavingsProjection } from '@/hooks'
import { ROUTES } from '@/lib/routes'

/** Goal names on the chart are cut to this many characters (full name in `<title>`). */
const MARKER_CHARS = 16

interface Row {
  time: number
  amount: number
}

/**
 * GET /reports/savings-projection (not period-bound): the real running total of the
 * contributions to ACTIVE goals, and their target dates as dashed vertical markers.
 * Nothing is projected — the endpoint doesn't project, and neither does this card.
 */
export function GoalSavingsCard() {
  const { t } = useTranslation('reports')
  const { locale, money } = useFormatters()
  const { data, isPending, isError, refetch } = useSavingsProjection()

  const rows: Row[] = (data?.points ?? []).map(point => ({
    time: Date.parse(point.date),
    amount: point.cumulativeAmount,
  }))
  const markers = (data?.markers ?? []).map(marker => ({
    ...marker,
    time: Date.parse(marker.date),
  }))
  const dateFormat = tooltipDateFormat(locale)

  return (
    <Card as="section" aria-labelledby="savings-title">
      <CardHeader title={t('savings.title')} titleId="savings-title" />
      <p className="mt-1 text-body-sm text-ink-muted">{t('savings.subtitle')}</p>

      {isError ? (
        <SectionError onRetry={() => void refetch()} className="mt-4" />
      ) : isPending ? (
        <Skeleton className="mt-5 h-60 w-full" />
      ) : rows.length === 0 ? (
        <p className="mt-4 text-body text-ink-muted">
          {t('savings.empty')}{' '}
          <Link
            to={ROUTES.goals}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('savings.goToGoals')}
          </Link>
        </p>
      ) : (
        <SavingsChart rows={rows} markers={markers} />
      )}

      {!isPending && !isError && rows.length > 0 && (
        <table className="sr-only">
          <caption>{t('savings.tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('savings.date')}</th>
              <th scope="col">{t('savings.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.time}>
                <td>{dateFormat.format(row.time)}</td>
                <td>{money(row.amount)}</td>
              </tr>
            ))}
            {markers.map(marker => (
              <tr key={`${marker.label}-${marker.time}`}>
                <td>{dateFormat.format(marker.time)}</td>
                <td>{t('savings.target', { name: marker.label })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function SavingsChart({
  rows: points,
  markers: targets,
}: {
  rows: Row[]
  markers: { label: string; time: number }[]
}) {
  const { t } = useTranslation('reports')
  const { locale, money } = useFormatters()
  const dateFormat = tooltipDateFormat(locale)
  // Read once: the axis reaches today even without recent contributions.
  const [now] = useState(() => Date.now())
  // The running total stays flat from the last contribution until today.
  const last = points[points.length - 1]
  const data = last.time < now ? [...points, { time: now, amount: last.amount }] : points
  const start = points[0].time
  const end = Math.max(now, points[points.length - 1].time, ...targets.map(m => m.time))
  const scale = niceTicks(Math.max(...points.map(point => point.amount)))
  const tickLabels = moneyTickLabels(scale.ticks, locale)
  const tickLabel = monthTickLabel(locale, end - start)

  return (
    <div
      role="img"
      aria-label={t('savings.summary', { amount: money(last.amount) })}
      className="mt-5 h-60 w-full sm:h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 24, right: 12, bottom: 0, left: 0 }}
          accessibilityLayer={false}
        >
          <CartesianGrid {...GRID} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[start, end]}
            tickFormatter={(time: number) => tickLabel(time)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={AXIS_LINE}
            minTickGap={40}
          />
          <YAxis
            domain={scale.domain}
            ticks={scale.ticks}
            interval={0}
            tickFormatter={(value: number) => tickLabels.get(value) ?? ''}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          {targets.map(marker => (
            <ReferenceLine
              key={`${marker.label}-${marker.time}`}
              x={marker.time}
              stroke={CHART_COLORS.projection}
              strokeDasharray={PROJECTION_DASH}
              label={<MarkerLabel text={marker.label} />}
            />
          ))}
          <Tooltip
            cursor={CURSOR}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined
              return (
                <ChartTooltip
                  active={active}
                  label={row && dateFormat.format(row.time)}
                  value={row && money(row.amount)}
                />
              )
            }}
          />
          <Area
            dataKey="amount"
            type="stepAfter"
            stroke="none"
            {...AREA_FILL}
            isAnimationActive={false}
            activeDot={false}
          />
          <Line
            dataKey="amount"
            type="stepAfter"
            stroke={CHART_COLORS.main}
            strokeWidth={LINE_WIDTH}
            // A single contribution is drawn as a point.
            dot={points.length === 1 ? { r: 4, fill: CHART_COLORS.main, strokeWidth: 0 } : false}
            activeDot={ACTIVE_DOT}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Goal name at the top of its marker, cut with an ellipsis; the full name in `<title>`. */
function MarkerLabel({ text, viewBox }: { text: string; viewBox?: { x?: number; y?: number } }) {
  const x = viewBox?.x ?? 0
  const y = (viewBox?.y ?? 0) - 8
  const short = text.length > MARKER_CHARS ? `${text.slice(0, MARKER_CHARS - 1)}…` : text
  return (
    // To the left of the marker: target dates sit at the right edge of the axis.
    <text x={x - 4} y={y} textAnchor="end" fill="var(--color-ink-muted)" fontSize={13}>
      <title>{text}</title>
      {short}
    </text>
  )
}
