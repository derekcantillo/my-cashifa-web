import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Amount,
  Button,
  Card,
  ConfirmDeleteDialog,
  Divider,
  Eyebrow,
  Menu,
  ProgressBar,
  Skeleton,
  type MenuItem,
} from '@/components/ui'
import { useAccounts, useDeleteLoan, useFormatters, useLoan } from '@/hooks'
import { formatDate, formatPercent } from '@/lib/format'
import { displayPercent, progressPercent } from '@/lib/goalMath'
import { useLoanModalStore } from '@/store/loanModalStore'
import { useToastStore } from '@/store/toastStore'
import type { Loan } from '@/types'

import { isOverdue, reminderText } from '../lib/loanView'
import { ReminderFallbackDialog } from './ReminderFallbackDialog'
import { RepaymentHistory } from './RepaymentHistory'

interface LoanDetailPanelProps {
  loan: Loan
  /** After deleting: the screen moves the selection elsewhere. */
  onDeleted: () => void
}

export function LoanDetailPanel({ loan, onDeleted }: LoanDetailPanelProps) {
  const { t } = useTranslation('loans')
  const { locale, money } = useFormatters()
  const openModal = useLoanModalStore(state => state.open)
  const { data: accounts } = useAccounts()
  const deleteLoan = useDeleteLoan()
  const pushToast = useToastStore(state => state.push)
  const [deleting, setDeleting] = useState(false)
  const [fallbackReminder, setFallbackReminder] = useState<string | null>(null)
  // Same query as the history below: the last repayment dates a paid loan.
  const { data: detail } = useLoan(loan.id)

  const paid = loan.status === 'PAID'
  // DELETE answers 400 once there are repayments (their history would be lost) — the
  // mobile app disables it too, with the reason in text.
  const canDelete = loan.amountRepaid <= 0
  const accountName = loan.accountId
    ? accounts?.find(account => account.id === loan.accountId)?.name
    : undefined
  const longDate = (iso: string) =>
    formatDate(iso, { locale, day: 'numeric', month: 'short', year: 'numeric' })

  const lastRepayment = detail?.repayments[0]?.paidAt // newest first
  const statusText = paid
    ? lastRepayment
      ? t('detail.paidOn', { date: longDate(lastRepayment) })
      : t('status.PAID')
    : t(`status.${loan.status}`)

  /** Copies the reminder; without clipboard access, shows it to copy by hand. */
  const copyReminder = async () => {
    const text = reminderText(t, loan, money)
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      pushToast(t('detail.reminderCopied'))
    } catch {
      setFallbackReminder(text)
    }
  }

  const menuItems: MenuItem[] = [
    // Only while something is owed. It copies; nothing is sent.
    ...(paid
      ? []
      : [
          {
            id: 'remind',
            label: t('detail.remind'),
            icon: Copy,
            onSelect: () => void copyReminder(),
          },
        ]),
    {
      id: 'edit',
      label: t('detail.edit'),
      icon: Pencil,
      onSelect: () => openModal('edit', loan.id),
    },
    {
      id: 'delete',
      label: t('detail.delete'),
      icon: Trash2,
      danger: true,
      disabled: !canDelete,
      onSelect: () => setDeleting(true),
    },
  ]

  return (
    <Card as="section" aria-labelledby="loan-detail-title" padding="lg" className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 id="loan-detail-title" className="text-heading break-words text-ink">
            {loan.borrowerName}
          </h2>
          <p className="text-body-sm text-ink-muted">{statusText}</p>
        </div>
        <Menu
          label={t('detail.actions')}
          icon={MoreHorizontal}
          items={menuItems}
          className="-mr-2"
        />
      </header>

      <div className="space-y-3">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Amount value={Math.max(0, loan.remainingAmount)} className="text-figure-lg text-ink" />
          <span className="text-body text-ink-muted tabular-nums">
            {t('detail.pending', { lent: money(loan.amount) })}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={progressPercent(loan.amountRepaid, loan.amount)}
            label={t('list.progressLabel', { name: loan.borrowerName })}
            size="md"
            className="flex-1"
          />
          <span className="w-11 text-right text-body-sm font-medium text-ink tabular-nums">
            {formatPercent(displayPercent(loan.amountRepaid, loan.amount) / 100, { locale })}
          </span>
        </div>
      </div>

      <dl className="grid gap-5 sm:grid-cols-3">
        <Datum label={t('detail.lentOn')}>{longDate(loan.loanDate)}</Datum>
        <Datum label={t('detail.dueDate')}>
          {loan.dueDate ? (
            <>
              <span className="block">{longDate(loan.dueDate)}</span>
              {isOverdue(loan) && (
                <span className="block text-body-sm font-normal text-ink-muted">
                  {t('detail.overdue')}
                </span>
              )}
            </>
          ) : (
            <span className="font-normal text-ink-muted">{t('detail.noDueDate')}</span>
          )}
        </Datum>
        <Datum label={t('detail.recovered')}>
          <Amount value={loan.amountRepaid} />
        </Datum>
        <Datum label={t('detail.account')}>
          {loan.accountId && !accounts ? (
            <Skeleton className="my-[3px] h-4 w-32" />
          ) : accountName ? (
            accountName
          ) : (
            // An id that no account matches (e.g. the account was removed) isn't "none".
            <span className="font-normal text-ink-muted">
              {loan.accountId ? t('detail.accountMissing') : t('detail.noAccount')}
            </span>
          )}
        </Datum>
        {loan.note && (
          <Datum label={t('detail.note')} className="sm:col-span-2">
            <span className="font-normal">{loan.note}</span>
          </Datum>
        )}
      </dl>

      {!paid && (
        <Button icon={Plus} onClick={() => openModal('repay', loan.id)}>
          {t('detail.repay')}
        </Button>
      )}
      {!canDelete && !paid && (
        <p className="-mt-4 text-body-sm text-ink-muted">{t('detail.cantDelete')}</p>
      )}

      <Divider />

      <RepaymentHistory loanId={loan.id} />

      {fallbackReminder && (
        <ReminderFallbackDialog text={fallbackReminder} onClose={() => setFallbackReminder(null)} />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title={t('delete.title')}
          confirmLabel={t('delete.confirm')}
          isPending={deleteLoan.isPending}
          error={deleteLoan.isError ? t('delete.error') : null}
          onCancel={() => setDeleting(false)}
          onConfirm={() =>
            deleteLoan.mutate(loan.id, {
              onSuccess: () => {
                pushToast(t('toast.deleted'))
                setDeleting(false)
                onDeleted()
              },
            })
          }
        >
          <p>{t('delete.body', { name: loan.borrowerName, amount: money(loan.amount) })}</p>
        </ConfirmDeleteDialog>
      )}
    </Card>
  )
}

function Datum({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <dt>
        <Eyebrow as="span">{label}</Eyebrow>
      </dt>
      <dd className="mt-1.5 text-body font-medium text-ink tabular-nums">{children}</dd>
    </div>
  )
}
