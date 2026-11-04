import { ArrowLeftRight, CreditCard, Plus, Receipt, SearchX } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

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
  useAccounts,
  useDebouncedValue,
  usePeriodLabel,
  useRecurringExpenses,
  useSelectedPeriod,
  useTransactions,
} from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { CATEGORY_PARAM } from '@/lib/routes'
import { useTransactionModalStore } from '@/store/transactionModalStore'
import { CATEGORIES, type Category } from '@/types'

import { CategoryBreakdownCard } from './components/CategoryBreakdownCard'
import { PendingRecurringCard } from './components/PendingRecurringCard'
import { TransactionDayList } from './components/TransactionDayList'
import { TransactionsSummary } from './components/TransactionsSummary'
import {
  categoriesOf,
  countByDirection,
  groupByDay,
  matchesDirection,
  matchesSearchAndCategory,
  NO_FILTERS,
  type DirectionFilter,
  type ListFilters,
} from './lib/transactionList'

const SEARCH_DEBOUNCE_MS = 150

/** `?category=` value, if it names a real category. */
function parseCategory(value: string | null): Category | '' {
  return value && (CATEGORIES as readonly string[]).includes(value) ? (value as Category) : ''
}

export function TransactionsPage() {
  const { t } = useTranslation(['transactions', 'common', 'categories'])
  const { period, periodId } = useSelectedPeriod()
  const periodLabel = usePeriodLabel(period)
  const { data, isPending, isError, refetch } = useTransactions(periodId)
  const { data: recurringExpenses } = useRecurringExpenses()
  const openModal = useTransactionModalStore(state => state.open)
  const openTransfer = useTransactionModalStore(state => state.openTransfer)
  // "Pagar tarjeta" only makes sense once there's a credit card to pay.
  const { data: accounts } = useAccounts()
  const hasCard = (accounts ?? []).some(account => account.type === 'CREDIT_CARD')
  const openForEdit = useCallback(({ id }: { id: string }) => openModal('edit', id), [openModal])

  // The category filter lives in the URL (`?category=`), so Reportes can link to it.
  const [params, setParams] = useSearchParams()
  const category = useMemo(() => parseCategory(params.get(CATEGORY_PARAM)), [params])
  const [localFilters, setLocalFilters] = useState<Omit<ListFilters, 'category'>>(NO_FILTERS)
  const filters: ListFilters = { ...localFilters, category }
  const setCategory = (next: Category | '') =>
    setParams(
      current => {
        const updated = new URLSearchParams(current)
        if (next) updated.set(CATEGORY_PARAM, next)
        else updated.delete(CATEGORY_PARAM)
        return updated
      },
      { replace: true },
    )
  const setFilters = (next: ListFilters) => {
    setLocalFilters({ direction: next.direction, query: next.query })
    setCategory(next.category)
  }
  const query = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS)
  const update = (patch: Partial<ListFilters>) => {
    const { category: nextCategory, ...rest } = patch
    if (Object.keys(rest).length > 0) setLocalFilters(current => ({ ...current, ...rest }))
    if (nextCategory !== undefined) setCategory(nextCategory)
  }

  const categoryLabel = useCallback(
    (value: Category) => t(CATEGORY_META[value].translationKey),
    [t],
  )

  const transactions = useMemo(() => data ?? [], [data])
  // Recomputed only when the debounced query or a filter changes, not on every keystroke.
  const searched = useMemo(
    () =>
      transactions.filter(transaction =>
        matchesSearchAndCategory(
          transaction,
          { query, category },
          categoryLabel,
          t('transactions:types.TRANSFER'),
        ),
      ),
    [transactions, query, category, categoryLabel, t],
  )
  const counts = useMemo(() => countByDirection(searched), [searched])
  const groups = useMemo(
    () =>
      groupByDay(
        searched.filter(transaction => matchesDirection(transaction, localFilters.direction)),
      ),
    [searched, localFilters.direction],
  )
  const hasFilters =
    filters.direction !== 'all' || filters.query.trim() !== '' || filters.category !== ''

  // Only categories that appear in the period, alphabetical in the active language.
  // The URL's category stays selectable even if the period has no movement in it.
  const categoriesInPeriod = [
    ...new Set([...categoriesOf(transactions), ...(category ? [category] : [])]),
  ]
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
            <div className="flex flex-wrap gap-2">
              {hasCard && (
                <Button
                  variant="ghost"
                  icon={CreditCard}
                  onClick={() => openTransfer({ cardPayment: true })}
                >
                  {t('transactions:page.payCard')}
                </Button>
              )}
              <Button variant="ghost" icon={ArrowLeftRight} onClick={() => openTransfer()}>
                {t('transactions:page.addTransfer')}
              </Button>
              <Button variant="secondary" icon={Plus} onClick={() => openModal('create')}>
                {t('transactions:page.add')}
              </Button>
            </div>
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
