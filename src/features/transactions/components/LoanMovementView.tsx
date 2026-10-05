import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button, buttonClassName, Eyebrow, ModalFooter, useModalClose } from '@/components/ui'
import { useFormatters } from '@/hooks'
import { CATEGORY_META } from '@/lib/categoryMeta'
import { formatDate } from '@/lib/format'
import { loanPath } from '@/lib/routes'
import { getTransactionDirection } from '@/lib/transactionDirection'
import type { Transaction } from '@/types'

import { loanIdOf } from '../lib/loanTransactions'

/** Read-only view of a LOAN_GIVEN / LOAN_REPAYMENT movement (changes go through Préstamos). */
export function LoanMovementView({ transaction }: { transaction: Transaction }) {
  const { t } = useTranslation(['transactions', 'categories'])
  const { locale, money } = useFormatters()
  const requestClose = useModalClose()
  const loanId = loanIdOf(transaction)
  const direction = getTransactionDirection(transaction.type)

  return (
    <>
      <div className="space-y-6">
        <p className="rounded-sm bg-surface-sunken px-3 py-2.5 text-body-sm text-ink-muted">
          {t('transactions:form.loanReadOnly')}
        </p>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Datum label={t('transactions:form.type')}>
            {t(`transactions:types.${transaction.type}`)}
          </Datum>
          <Datum label={t('transactions:form.amount')}>
            <span className={direction === 'in' ? 'text-positive' : undefined}>
              {direction === 'in' ? '+' : '−'}
              {money(transaction.amount)}
            </span>
          </Datum>
          <Datum label={t('transactions:form.category')}>
            {t(CATEGORY_META[transaction.category].translationKey)}
          </Datum>
          <Datum label={t('transactions:form.date')}>
            {formatDate(transaction.transactionDate, {
              locale,
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Datum>
          <Datum label={t('transactions:form.account')}>
            {transaction.account?.name ?? (
              <span className="font-normal text-ink-muted">{t('transactions:form.noAccount')}</span>
            )}
          </Datum>
          {transaction.description && (
            <Datum label={t('transactions:form.note')}>{transaction.description}</Datum>
          )}
        </dl>
      </div>

      <ModalFooter>
        {loanId && (
          <Link
            to={loanPath(loanId)}
            onClick={requestClose}
            className={buttonClassName({ variant: 'ghost' })}
          >
            {t('transactions:form.viewLoan')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
        <Button variant="secondary" className="ml-auto" onClick={requestClose}>
          {t('transactions:form.close')}
        </Button>
      </ModalFooter>
    </>
  )
}

function Datum({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>
        <Eyebrow as="span">{label}</Eyebrow>
      </dt>
      <dd className="mt-1.5 text-body font-medium text-ink tabular-nums">{children}</dd>
    </div>
  )
}
