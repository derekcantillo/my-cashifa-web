import { Inbox, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher, PageContainer, ThemeSwitcher } from '@/components/layout'
import {
  Amount,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  Eyebrow,
  IconButton,
  Input,
  PageHeader,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Stat,
  Switch,
  type ButtonVariant,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDate, formatPercent, formatPeriodRange } from '@/lib/format'
import { useTheme } from '@/theme'

import { AlertsShowcase } from './AlertsShowcase'
import { NetWorthShowcase } from './NetWorthShowcase'

/** Dev-only copy, kept out of the production locale files. */
const COPY = {
  es: {
    eyebrow: 'Sistema de diseño',
    title: 'Tactile Neo-Minimalism',
    description:
      'Tokens, tipografía y primitivos de Cashifa. Revisa cada sección en claro, oscuro y automático, y en los dos idiomas.',
    tokens: 'Tokens',
    typography: 'Tipografía',
    primitives: 'Primitivos',
    composition: 'Composición',
    netWorth: 'Patrimonio neto',
    netWorthNote:
      'Pantalla real con estados simulados (sin requests). Las cifras se calculan con las fórmulas del backend.',
    netWorthScenarios: {
      typical: 'Típico',
      many: 'Muchas cuentas · sin saldo inicial',
      negative: 'Negativo · grupo negativo',
      empty: 'Sin cuentas · activos en 0',
      netWorthFailed: 'Falla /net-worth',
      listsFailed: 'Fallan las listas',
      loading: 'Cargando',
    },
    alerts: 'Alertas',
    alertsAll: 'Lista completa (36 alertas, sin filtros)',
    alertsCombined: 'Filtro combinado: no leídas + gasto fijo',
    alertsNote:
      'Componente real de la lista con datos simulados. Las acciones solo cambian el estado local: no se envía ninguna request.',
    available: 'Balance disponible',
    spent: 'Gastado este periodo',
    budget: 'Presupuesto',
    savings: 'Ahorro del periodo',
    ofIncome: 'del ingreso',
    remaining: 'Te quedan',
    days: '9 días para el próximo salario',
    rent: 'Arriendo',
    market: 'Mercado',
    salary: 'Salario',
    search: 'Buscar movimientos',
    amount: 'Monto',
    invalid: 'Escribe un monto válido',
    disabled: 'Deshabilitado',
    active: 'Gasto fijo activo',
    emptyTitle: 'Aún no hay movimientos',
    emptyBody: 'Cuando registres tu primer gasto del periodo, aparecerá aquí agrupado por día.',
    register: 'Registrar gasto',
    edit: 'Editar',
    delete: 'Eliminar',
    onTrack: 'En curso',
    over: 'Excedido',
    near: 'Cerca del límite',
    neutral: 'Pausada',
    states: ['Normal', 'Hover', 'Focus', 'Pressed', 'Disabled', 'Loading'],
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
  },
  en: {
    eyebrow: 'Design system',
    title: 'Tactile Neo-Minimalism',
    description:
      'Cashifa tokens, typography and primitives. Check every section in light, dark and automatic, and in both languages.',
    tokens: 'Tokens',
    typography: 'Typography',
    primitives: 'Primitives',
    composition: 'Composition',
    netWorth: 'Net worth',
    netWorthNote:
      'The real screen over mock states (no requests). Figures use the backend formulas.',
    netWorthScenarios: {
      typical: 'Typical',
      many: 'Many accounts · no starting balance',
      negative: 'Negative · negative group',
      empty: 'No accounts · zero assets',
      netWorthFailed: '/net-worth fails',
      listsFailed: 'Lists fail',
      loading: 'Loading',
    },
    alerts: 'Alerts',
    alertsAll: 'Full list (36 alerts, no filters)',
    alertsCombined: 'Combined filter: unread + recurring expense',
    alertsNote:
      'The real list component over mock data. Actions only change local state: no request is sent.',
    available: 'Available balance',
    spent: 'Spent this period',
    budget: 'Budget',
    savings: 'Saved this period',
    ofIncome: 'of income',
    remaining: 'You have',
    days: '9 days until next payday',
    rent: 'Rent',
    market: 'Groceries',
    salary: 'Salary',
    search: 'Search transactions',
    amount: 'Amount',
    invalid: 'Enter a valid amount',
    disabled: 'Disabled',
    active: 'Recurring expense active',
    emptyTitle: 'No transactions yet',
    emptyBody: "Once you add this period's first expense, it shows up here grouped by day.",
    register: 'Add expense',
    edit: 'Edit',
    delete: 'Delete',
    onTrack: 'On track',
    over: 'Over budget',
    near: 'Near the limit',
    neutral: 'Paused',
    states: ['Default', 'Hover', 'Focus', 'Pressed', 'Disabled', 'Loading'],
    week: 'Week',
    month: 'Month',
    year: 'Year',
  },
} as const

const TOKEN_GROUPS: { title: string; tokens: string[] }[] = [
  {
    title: 'Surfaces',
    tokens: ['canvas', 'surface', 'surface-raised', 'surface-sunken', 'line', 'track'],
  },
  { title: 'Ink', tokens: ['ink', 'ink-muted', 'ink-subtle'] },
  { title: 'Accent', tokens: ['accent', 'accent-hover', 'accent-ink', 'accent-soft'] },
  {
    title: 'Meaning',
    tokens: ['positive', 'positive-soft', 'negative', 'negative-soft', 'warning', 'warning-soft'],
  },
  {
    title: 'Chart',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-other'],
  },
]

/** Static stand-ins for interactive states, so they can be reviewed side by side. */
const FORCED_STATE: Record<ButtonVariant, string[]> = {
  primary: [
    '',
    'bg-accent-hover',
    'outline-2 outline-offset-2 outline-accent',
    'translate-y-px shadow-pressed',
  ],
  secondary: [
    '',
    'bg-surface',
    'outline-2 outline-offset-2 outline-accent',
    'translate-y-px shadow-pressed',
  ],
  ghost: [
    '',
    'bg-surface-sunken text-ink',
    'outline-2 outline-offset-2 outline-accent',
    'translate-y-px shadow-pressed',
  ],
  danger: [
    '',
    'bg-negative-hover',
    'outline-2 outline-offset-2 outline-accent',
    'translate-y-px shadow-pressed',
  ],
  'danger-ghost': [
    '',
    'bg-negative-soft',
    'outline-2 outline-offset-2 outline-accent',
    'translate-y-px shadow-pressed',
  ],
  link: ['', 'underline', 'outline-2 outline-offset-2 outline-accent', 'opacity-80'],
}

export function DesignShowcasePage() {
  const { i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
  const copy = i18n.resolvedLanguage === 'en' ? COPY.en : COPY.es
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month')
  const [active, setActive] = useState(true)
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-canvas">
      <PageContainer className="space-y-16 pb-24">
        <PageHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <ThemeSwitcher compact={false} />
              <LanguageSwitcher />
            </>
          }
        />
        <p className="text-body-sm text-ink-subtle">
          data-theme = {resolvedTheme} · lang = {i18n.resolvedLanguage}
        </p>

        {/* ---------- Composition ---------- */}
        <Section title={copy.composition}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card variant="raised" padding="lg" className="space-y-8">
              <div className="space-y-3">
                <Eyebrow>{copy.available}</Eyebrow>
                <Amount value={1842350} className="block font-serif text-display-xl" />
                <p className="text-body text-ink-muted">
                  {copy.remaining} <Amount value={1842350} className="font-medium text-ink" /> ·{' '}
                  {copy.days}
                </p>
              </div>
              <ProgressBar value={62} label={copy.spent} size="md" />
              <Divider />
              <div className="grid grid-cols-2 gap-6">
                <Stat
                  label={copy.spent}
                  value={<Amount value={2957650} />}
                  hint={
                    <>
                      {formatPercent(0.62)} · {copy.budget} <Amount value={4800000} />
                    </>
                  }
                />
                <Stat
                  label={copy.savings}
                  value={<Amount value={720000} colorBySign showPlus />}
                  hint={`${formatPercent(0.15)} ${copy.ofIncome}`}
                />
              </div>
            </Card>

            <Card variant="flat" padding="none">
              <ul className="divide-y divide-line">
                {[
                  { name: copy.salary, value: 4800000, date: '2026-09-28T15:00:00Z' },
                  { name: copy.rent, value: -1450000, date: '2026-09-29T15:00:00Z' },
                  { name: copy.market, value: -238900, date: '2026-09-30T22:00:00Z' },
                  { name: 'Netflix', value: -26900, date: '2026-10-01T13:00:00Z' },
                ].map(row => (
                  <li key={row.name} className="flex items-center gap-4 px-6 py-4">
                    <Wallet aria-hidden className="text-ink-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{row.name}</p>
                      <p className="text-body-sm text-ink-muted">
                        {formatDate(row.date, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <Amount value={row.value} colorBySign showPlus className="font-medium" />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        {/* ---------- Tokens ---------- */}
        <Section title={copy.tokens}>
          <div className="space-y-8">
            {TOKEN_GROUPS.map(group => (
              <div key={group.title} className="space-y-3">
                <Eyebrow as="h3">{group.title}</Eyebrow>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {group.tokens.map(token => (
                    <div key={token} className="space-y-2">
                      <div
                        className="h-16 rounded-md border border-line"
                        style={{ backgroundColor: `var(--color-${token})` }}
                      />
                      <p className="font-mono text-body-sm text-ink-muted">{token}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-3">
              <Eyebrow as="h3">Elevation · radius</Eyebrow>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(['flat', 'raised', 'floating', 'inset'] as const).map(variant => (
                  <Card key={variant} variant={variant} padding="sm" className="h-24">
                    <p className="font-mono text-body-sm text-ink-muted">{variant}</p>
                  </Card>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {(['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-card'] as const).map(r => (
                  <div
                    key={r}
                    className={cn('flex size-20 items-end bg-surface-raised p-2 shadow-raised', r)}
                  >
                    <span className="font-mono text-[11px] text-ink-subtle">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- Typography ---------- */}
        <Section title={copy.typography}>
          <div className="space-y-6">
            <TypeRow name="display-xl · serif 56/1.0">
              <Amount value={12480000} className="font-serif text-display-xl" />
            </TypeRow>
            <TypeRow name="display-lg · serif 44/1.05">
              <span className="font-serif text-display-lg">{copy.available}</span>
            </TypeRow>
            <TypeRow name="display-md · serif 32/1.1">
              <span className="font-serif text-display-md">{copy.emptyTitle}</span>
            </TypeRow>
            <TypeRow name="title · sans 600 20/1.3">
              <span className="text-title">{copy.spent}</span>
            </TypeRow>
            <TypeRow name="body · 14/1.5">
              <span className="text-body">
                {copy.rent} ·{' '}
                {
                  formatPeriodRange({
                    startDate: '2026-08-28T10:00:00.000Z',
                    endDate: '2026-09-28T10:00:00.000Z',
                  }).range
                }
              </span>
            </TypeRow>
            <TypeRow name="body-sm · 13/1.45">
              <span className="text-body-sm text-ink-muted">{copy.days}</span>
            </TypeRow>
            <TypeRow name="eyebrow · 500 11.5 / 0.08em">
              <Eyebrow>{copy.available}</Eyebrow>
            </TypeRow>
            <TypeRow name="tabular-nums">
              <div className="w-48 space-y-1 text-right tabular-nums">
                {[1111111, 888888, 45000, -7].map(value => (
                  <Amount key={value} value={value} className="block" />
                ))}
              </div>
            </TypeRow>
          </div>
        </Section>

        {/* ---------- Primitives ---------- */}
        <Section title={copy.primitives}>
          <div className="space-y-10">
            <Demo title="Button">
              <div className="overflow-x-auto">
                <table className="text-left">
                  <thead>
                    <tr>
                      <th />
                      {copy.states.map(state => (
                        <th key={state} className="px-3 pb-3 font-normal">
                          <Eyebrow as="span">{state}</Eyebrow>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      ['primary', 'secondary', 'ghost', 'danger', 'danger-ghost', 'link'] as const
                    ).map(variant => (
                      <tr key={variant}>
                        <th className="pr-3 font-mono text-body-sm font-normal text-ink-muted">
                          {variant}
                        </th>
                        {FORCED_STATE[variant].map((forced, index) => (
                          <td key={index} className="px-3 py-2">
                            <Button variant={variant} className={forced} tabIndex={-1}>
                              {copy.register}
                            </Button>
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <Button variant={variant} disabled>
                            {copy.register}
                          </Button>
                        </td>
                        <td className="px-3 py-2">
                          <Button variant={variant} loading>
                            {copy.register}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button icon={Plus}>{copy.register}</Button>
                <Button size="sm" variant="secondary" icon={Pencil}>
                  {copy.edit}
                </Button>
                <Button size="sm" variant="ghost">
                  {copy.delete}
                </Button>
                <IconButton label={copy.edit} icon={Pencil} />
                <IconButton label={copy.delete} icon={Trash2} variant="secondary" />
                <IconButton label={copy.delete} icon={Trash2} size="sm" disabled />
              </div>
            </Demo>

            <Demo title="Badge">
              <div className="flex flex-wrap gap-2">
                <Badge>{copy.neutral}</Badge>
                <Badge tone="positive">{copy.onTrack}</Badge>
                <Badge tone="warning">{copy.near}</Badge>
                <Badge tone="negative">{copy.over}</Badge>
              </div>
            </Demo>

            <Demo title="Stat · Amount">
              <div className="grid gap-8 sm:grid-cols-3">
                <Stat
                  label={copy.available}
                  value={<Amount value={1842350} />}
                  font="serif"
                  hint={copy.days}
                />
                <Stat label={copy.savings} value={<Amount value={720000} colorBySign showPlus />} />
                <Stat label={copy.spent} value={<Amount value={-2957650} colorBySign />} />
              </div>
              <p className="text-body">
                <Amount value={2450000} compact /> · <Amount value={0} colorBySign showPlus /> ·{' '}
                <Amount value={-120000} colorBySign />
              </p>
            </Demo>

            <Demo title="ProgressBar">
              <div className="grid max-w-md gap-4">
                <ProgressBar value={38} label="accent" />
                <ProgressBar value={64} label="positive" tone="positive" />
                <ProgressBar value={88} label="warning" tone="warning" />
                <ProgressBar value={100} label="negative" tone="negative" size="md" />
              </div>
            </Demo>

            <Demo title="Input · SearchInput">
              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <Input aria-label={copy.amount} placeholder="0" inputMode="decimal" />
                <Input aria-label={copy.amount} defaultValue="48.000" />
                <div className="space-y-1.5">
                  <Input aria-label={copy.amount} defaultValue="48,0,0" invalid />
                  <p className="text-body-sm text-negative">{copy.invalid}</p>
                </div>
                <Input aria-label={copy.disabled} defaultValue={copy.disabled} disabled />
                <SearchInput
                  label={copy.search}
                  placeholder={copy.search}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  onClear={() => setQuery('')}
                  className="sm:col-span-2"
                />
              </div>
            </Demo>

            <Demo title="Switch · SegmentedControl">
              <div className="flex flex-wrap items-center gap-8">
                <Switch checked={active} onChange={setActive} label={copy.active} />
                <Switch checked={false} onChange={() => undefined} label={copy.disabled} disabled />
                <SegmentedControl
                  label="range"
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: 'week', label: copy.week },
                    { value: 'month', label: copy.month },
                    { value: 'year', label: copy.year },
                  ]}
                />
                <ThemeSwitcher />
              </div>
            </Demo>

            <Demo title="Skeleton · Divider">
              <div className="max-w-md space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Divider />
                <Skeleton className="h-3 w-24" />
              </div>
            </Demo>

            <Demo title="EmptyState">
              <Card variant="flat" padding="none">
                <EmptyState
                  icon={Inbox}
                  title={copy.emptyTitle}
                  description={copy.emptyBody}
                  action={<Button icon={Plus}>{copy.register}</Button>}
                />
              </Card>
            </Demo>
          </div>
        </Section>

        {/* ---------- Net worth ---------- */}
        <Section title={copy.netWorth}>
          <p className="text-body-sm text-ink-muted">{copy.netWorthNote}</p>
          <NetWorthShowcase labels={copy.netWorthScenarios} />
        </Section>

        {/* ---------- Alerts ---------- */}
        <Section title={copy.alerts}>
          <p className="text-body-sm text-ink-muted">{copy.alertsNote}</p>
          <Demo title={copy.alertsAll}>
            <AlertsShowcase />
          </Demo>
          <Demo title={copy.alertsCombined}>
            <AlertsShowcase initialFilters={{ unreadOnly: true, type: 'RECURRING_EXPENSE_DUE' }} />
          </Demo>
        </Section>
      </PageContainer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-title">{title}</h2>
        <Divider />
      </div>
      {children}
    </section>
  )
}

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <Eyebrow as="h3">{title}</Eyebrow>
      {children}
    </div>
  )
}

function TypeRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="grid items-baseline gap-2 sm:grid-cols-[220px_1fr]">
      <p className="font-mono text-body-sm text-ink-subtle">{name}</p>
      <div className="min-w-0 text-ink">{children}</div>
    </div>
  )
}
