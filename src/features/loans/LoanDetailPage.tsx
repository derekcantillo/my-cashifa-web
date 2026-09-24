import axios from 'axios'
import { ArrowLeft, CircleCheck, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  AmountEntryForm,
  ConfirmDeletePopover,
  IconButton,
  InlineError,
  Skeleton,
} from '@/components/ui'
import { useCreateLoanRepayment, useDeleteLoan, useFormatters, useLoan } from '@/hooks'
import { ROUTES } from '@/lib/routes'
import { useLoanModalStore } from '@/store/loanModalStore'
import { useToastStore } from '@/store/toastStore'

import { LoanDueDate } from './components/LoanDueDate'
import { RepaymentList } from './components/RepaymentList'

export function LoanDetailPage() {
  const { t } = useTranslation('loans')
  const { money, shortDate } = useFormatters()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: loan, isPending, isError, error, refetch } = useLoan(id)
  const openModal = useLoanModalStore(state => state.open)
  const repay = useCreateLoanRepayment()
  const deleteLoan = useDeleteLoan()
  const pushToast = useToastStore(state => state.push)
  const [repaying, setRepaying] = useState(false)

  const backLink = (
    <Link
      to={ROUTES.loans}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {t('detail.back')}
    </Link>
  )

  if (isError) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {backLink}
        {notFound ? (
          <p className="text-ink-muted">{t('detail.notFound')}</p>
        ) : (
          <InlineError onRetry={() => void refetch()} />
        )}
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-8" aria-busy="true">
        {backLink}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-14 w-72 max-w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  // Same rule as the backend (and mobile): a loan with repayments can't be deleted.
  const hasRepayments = loan.amountRepaid > 0
  const isPaid = loan.status === 'PAID'

  const onDelete = async () => {
    await deleteLoan.mutateAsync(loan.id)
    pushToast(t('toast.deleted'))
    navigate(ROUTES.loans, { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-4">
        {backLink}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{loan.borrowerName}</h1>
            {loan.note && <p className="text-ink-muted">{loan.note}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <IconButton
                label={t('detail.edit')}
                icon={Pencil}
                onClick={() => openModal('edit', loan.id)}
              />
              <ConfirmDeletePopover
                label={t('detail.delete')}
                title={t('form.deleteConfirm')}
                disabled={hasRepayments}
                isPending={deleteLoan.isPending}
                error={deleteLoan.isError ? t('form.deleteError') : null}
                onConfirm={() => void onDelete().catch(() => undefined)}
              />
            </div>
            {hasRepayments && (
              <p className="max-w-56 text-right text-xs text-ink-muted">{t('form.cantDelete')}</p>
            )}
          </div>
        </header>
      </div>

      <section aria-labelledby="pending-label" className="space-y-3">
        <p id="pending-label" className="text-ink-muted">
          {t('detail.pending')}
        </p>
        <p className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          {money(loan.remainingAmount)}
        </p>
        <p className="text-ink-muted tabular-nums">
          {t('detail.summary', { total: money(loan.amount), recovered: money(loan.amountRepaid) })}
        </p>
        <p className="text-sm text-ink-muted">
          {t('detail.lent', { date: shortDate(loan.loanDate) })}
          <LoanDueDate loan={loan} prefix=" · " />
        </p>

        <div className="pt-3">
          {isPaid ? (
            <p className="inline-flex items-center gap-2 font-medium">
              <CircleCheck className="size-5 text-success" aria-hidden />
              {t('detail.paid')}
            </p>
          ) : !repaying ? (
            <button
              type="button"
              onClick={() => setRepaying(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
            >
              <Plus className="size-4" aria-hidden />
              {t('detail.repay')}
            </button>
          ) : null}
        </div>
        {repaying && !isPaid && (
          <AmountEntryForm
            idPrefix="repayment"
            submitLabel={t('repayment.save')}
            // The backend doesn't stop over-repayment; the form does.
            maxAmount={loan.remainingAmount}
            errorMessage={repay.isError ? t('repayment.saveError') : null}
            onCancel={() => setRepaying(false)}
            onSubmit={async ({ amount, date, note }) => {
              await repay.mutateAsync({
                id: loan.id,
                input: { amount, paidAt: date, ...(note ? { note } : {}) },
              })
              pushToast(t('toast.repaid'))
              setRepaying(false)
            }}
          />
        )}
      </section>

      <RepaymentList repayments={loan.repayments} />
    </div>
  )
}
