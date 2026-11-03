import { HandCoins, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  CardHeader,
  ConfirmDeleteDialog,
  EmptyState,
  IconButton,
  SectionError,
  Skeleton,
} from '@/components/ui'
import { useApiErrorMessages, useDeleteLoanRepayment, useFormatters, useLoan } from '@/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import { useToastStore } from '@/store/toastStore'
import type { LoanRepayment } from '@/types'

const VISIBLE = 8

/** Repayments come only with GET /loans/:id (the list doesn't carry them). */
export function RepaymentHistory({ loanId }: { loanId: string }) {
  const { t } = useTranslation('loans')
  const { money, shortDate } = useFormatters()
  const { data, isPending, isError, refetch } = useLoan(loanId)
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState<LoanRepayment | null>(null)
  const deleteRepayment = useDeleteLoanRepayment()
  const pushToast = useToastStore(state => state.push)
  const apiErrorMessages = useApiErrorMessages()
  const deleteError = apiErrorMessage(deleteRepayment.error, {
    ...apiErrorMessages,
    unknown: t('history.deleteError'),
  })
  const repayments = data?.repayments ?? []
  const visible = expanded ? repayments : repayments.slice(0, VISIBLE)

  const labelsOf = (repayment: LoanRepayment) => ({
    amount: money(repayment.amount),
    date: shortDate(repayment.paidAt),
  })
  const askToDelete = (repayment: LoanRepayment) => {
    deleteRepayment.reset()
    setConfirming(repayment)
  }
  const confirmDelete = (repayment: LoanRepayment) => {
    deleteRepayment.mutate(
      { id: loanId, repaymentId: repayment.id },
      {
        onSuccess: () => {
          setConfirming(null)
          pushToast(t('toast.repaymentDeleted'))
        },
      },
    )
  }

  return (
    <section aria-labelledby="repayments-title" className="space-y-2">
      <CardHeader
        titleId="repayments-title"
        title={
          repayments.length > 0
            ? `${t('history.title')} (${repayments.length})`
            : t('history.title')
        }
      />
      {isError ? (
        <SectionError message={t('history.loadError')} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div aria-busy className="space-y-3 py-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : repayments.length === 0 ? (
        <EmptyState
          size="sm"
          icon={HandCoins}
          title={t('history.emptyTitle')}
          description={t('history.emptyBody')}
        />
      ) : (
        <>
          {/* Newest first, as the API sends them. */}
          <ul className="divide-y divide-line">
            {visible.map(repayment => {
              const labels = labelsOf(repayment)
              return (
                <li key={repayment.id} className="py-2">
                  <div className="flex min-h-10 items-center gap-4">
                    <span className="w-24 shrink-0 text-body-sm text-ink-muted tabular-nums">
                      {labels.date}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body text-ink">
                      {repayment.note}
                    </span>
                    <span className="shrink-0 text-body font-medium text-positive tabular-nums">
                      +{labels.amount}
                    </span>
                    <IconButton
                      size="sm"
                      icon={Trash2}
                      label={t('history.delete', labels)}
                      onClick={() => askToDelete(repayment)}
                      disabled={deleteRepayment.isPending}
                      className="-mr-2"
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          {repayments.length > VISIBLE && (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              onClick={() => setExpanded(value => !value)}
              className="-ml-3"
            >
              {expanded
                ? t('history.showLess')
                : t('history.showAll', { count: repayments.length })}
            </Button>
          )}
        </>
      )}

      {confirming && (
        <ConfirmDeleteDialog
          title={t('history.deleteTitle')}
          confirmLabel={t('history.deleteConfirm')}
          isPending={deleteRepayment.isPending}
          error={deleteError}
          onConfirm={() => confirmDelete(confirming)}
          onCancel={() => setConfirming(null)}
        >
          <p>{t('history.deleteBody', labelsOf(confirming))}</p>
        </ConfirmDeleteDialog>
      )}
    </section>
  )
}
