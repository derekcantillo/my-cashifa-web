import { Plus, Receipt, SearchX } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  EmptyState,
  Enter,
  PageHeader,
  SearchInput,
  SectionError,
  SegmentedControl,
  Select,
  TransactionRowsSkeleton,
  type SegmentedOption,
} from '@/components/ui'
import {
  useDebouncedValue,
  usePeriodLabel,
  useRecurringExpenses,
  useSelectedPeriod,
  useTransactions,
} from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import type { Category } from '@/types'

import { CategoryBreakdownCard } from './components/CategoryBreakdownCard'
import { PendingRecurringCard } from './components/PendingRecurringCard'
import { TransactionDayList } from './components/TransactionDayList'
import { TransactionsSummary } from './components/TransactionsSummary'
import {
  countByDirection,
  groupByDay,
  matchesDirection,
  matchesSearchAndCategory,
  NO_FILTERS,
  type DirectionFilter,
  type ListFilters,
} from './lib/transactionList'

const SEARCH_DEBOUNCE_MS = 150

export function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'common', 'categories'])
  const { period, periodId } = useSelectedPeriod()
  const periodLabel = usePeriodLabel(period)
  const { data, isPending, isError, refetch } = useTransactions(periodId)
  const { data: recurringExpenses } = useRecurringExpenses()
  const openModal = useTransactionModalStore(state => state.open)
  const openForEdit = useCallback(({ id }: { id: string }) => openModal('edit', id), [openModal])

  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  const query = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS)
  const update = (patch: Partial<ListFilters>) => setFilters(current => ({ ...current, ...patch }))

  const categoryLabel = useCallback(
    (category: Category) => t(CATEGORY_META[category].translationKey),
    [t],
  )

  const transactions = useMemo(() => data ?? [], [data])
  // Recomputed only when the debounced query or a filter changes, not on every keystroke.
  const searched = useMemo(
    () =>
      transactions.filter(transaction =>
        matchesSearchAndCategory(transaction, { query, category: filters.category }, categoryLabel),
      ),
    [transactions, query, filters.category, categoryLabel],
  )
  const counts = useMemo(() => countByDirection(searched), [searched])
  const groups = useMemo(
    () =>
      groupByDay(searched.filter(transaction => matchesDirection(transaction, filters.direction))),
    [searched, filters.direction],
  )
  const hasFilters =
    filters.direction !== 'all' || filters.query.trim() !== '' || filters.category !== ''

  // Only categories that appear in the period, alphabetical in the active language.
  const categoriesInPeriod = [...new Set(transactions.map(transaction => transaction.category))]
    .map(category => ({ category, label: categoryLabel(category) }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const recurringById = useMemo(
    () => new Map((recurringExpenses ?? []).map(item => [item.id, item])),
    [recurringExpenses],
  )

  const directionOptions: SegmentedOption<DirectionFilter>[] = [
    { value: 'all', label: t('transactions:page.all'), count: counts.all },
    { value: 'income', label: t('transactions:page.income'), count: counts.income },
    { value: 'expense', label: t('transactions:page.expense'), count: counts.expense },
  ]

  return (
    <div className="space-y-8">
      <Enter order={0}>
        <PageHeader
          eyebrow={periodLabel ?? t('transactions:page.eyebrowLoading')}
          title={t('common:nav.transactions')}
          actions={
            // Secondary: the topbar's "Registrar gasto" stays the one primary action.
            <Button variant="secondary" icon={Plus} onClick={() => openModal('create')}>
              {t('transactions:page.add')}
            </Button>
          }
        />
      </Enter>

      <Enter order={1}>
        <TransactionsSummary periodId={periodId} count={data?.length} />
      </Enter>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Enter order={2} className="min-w-0 space-y-4 lg:col-span-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SegmentedControl
              label={t('transactions:page.filter')}
              value={filters.direction}
              options={directionOptions}
              onChange={direction => update({ direction })}
              size="sm"
              className="md:shrink-0"
            />
            <SearchInput
              label={t('transactions:page.search')}
              placeholder={t('transactions:page.searchPlaceholder')}
              value={filters.query}
              onChange={event => update({ query: event.target.value })}
              onClear={() => update({ query: '' })}
              clearLabel={t('transactions:page.clearSearch')}
              className="min-w-0 flex-1"
            />
            <Select
              aria-label={t('transactions:page.categoryFilter')}
              value={filters.category}
              onChange={event => update({ category: event.target.value as Category | '' })}
              className="md:w-48"
            >
              <option value="">{t('transactions:page.categoryAll')}</option>
              {categoriesInPeriod.map(({ category, label }) => (
                <option key={category} value={category}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <Card as="section" aria-label={t('transactions:page.listLabel')} padding="md">
            {isError ? (
              <SectionError onRetry={() => void refetch()} />
            ) : isPending ? (
              <TransactionRowsSkeleton rows={8} />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={t('transactions:page.emptyTitle')}
                description={t('transactions:page.emptyBody')}
                action={
                  <Button icon={Plus} onClick={() => openModal('create')}>
                    {t('transactions:page.add')}
                  </Button>
                }
              />
            ) : groups.length === 0 ? (
              <EmptyState
                size="sm"
                icon={SearchX}
                title={t('transactions:page.noResultsTitle')}
                description={t('transactions:page.noResultsBody')}
                action={
                  hasFilters && (
                    <Button variant="secondary" size="sm" onClick={() => setFilters(NO_FILTERS)}>
                      {t('transactions:page.clearFilters')}
                    </Button>
                  )
                }
              />
            ) : (
              <TransactionDayList
                groups={groups}
                recurringById={recurringById}
                onSelect={openForEdit}
              />
            )}
          </Card>
        </Enter>

        <Enter order={3} className="space-y-6 lg:col-span-4">
          <PendingRecurringCard periodId={periodId} />
          <CategoryBreakdownCard periodId={periodId} />
        </Enter>
      </div>
    </div>
  )
}
