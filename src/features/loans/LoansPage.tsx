import { HandCoins, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { MasterDetailLayout } from '@/components/layout'
import { Button, Card, EmptyState, PageHeader, SectionError, Skeleton } from '@/components/ui'
import { useLoans, useMasterDetail } from '@/hooks'
import { LOAN_PARAM, loanPath } from '@/lib/routes'
import { useLoanModalStore } from '@/store/loanModalStore'

import { LoanDetailPanel } from './components/LoanDetailPanel'
import { LoanList } from './components/LoanList'
import { LoansHero } from './components/LoansHero'
import { defaultLoan, groupLoans } from './lib/loanView'

/**
 * Loans (money lent to others): list + detail of the selected loan, kept in
 * `?loan=<id>` — the same master-detail layout as Metas.
 */
export function LoansPage() {
  const { t } = useTranslation('loans')
  const { data, isPending, isError, refetch } = useLoans()
  const openModal = useLoanModalStore(state => state.open)
  const groups = useMemo(() => groupLoans(data ?? []), [data])
  const { requested, selected, isDesktop, select, backToList, clearSelection } = useMasterDetail({
    items: data,
    param: LOAN_PARAM,
    defaultItem: defaultLoan(groups),
    pathFor: loanPath,
  })

  return (
    <MasterDetailLayout
      detailOpen={Boolean(requested)}
      backLabel={t('detail.back')}
      onBack={backToList}
      header={
        <PageHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          actions={
            <Button variant="secondary" icon={Plus} onClick={() => openModal('create')}>
              {t('new')}
            </Button>
          }
        />
      }
      body={
        isError ? (
          <SectionError onRetry={() => void refetch()} />
        ) : isPending ? (
          <LoansSkeleton />
        ) : data.length === 0 ? (
          <Card variant="flat" padding="none">
            <EmptyState
              icon={HandCoins}
              title={t('empty.title')}
              description={t('empty.body')}
              action={
                <Button icon={Plus} onClick={() => openModal('create')}>
                  {t('empty.cta')}
                </Button>
              }
            />
          </Card>
        ) : undefined
      }
      hero={data && <LoansHero loans={data} />}
      list={
        <LoanList
          open={groups.open}
          paid={groups.paid}
          selectedId={isDesktop ? selected?.id : undefined}
          onSelect={select}
        />
      }
      detail={
        selected && <LoanDetailPanel key={selected.id} loan={selected} onDeleted={clearSelection} />
      }
    />
  )
}

function LoansSkeleton() {
  return (
    <div aria-busy className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-11 w-64 sm:h-14 sm:w-80" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card padding="sm" className="space-y-1 lg:col-span-5">
          {[0, 1, 2].map(index => (
            <div key={index} className="space-y-2.5 px-3 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </Card>
        <Card padding="lg" className="hidden space-y-6 lg:col-span-7 lg:block">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    </div>
  )
}
