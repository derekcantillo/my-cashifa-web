import type { Transaction } from '@/types'

/** Money between two of the user's own accounts: neither spending nor income. */
export function isTransfer(transaction: Pick<Transaction, 'type'>): boolean {
  return transaction.type === 'TRANSFER'
}

/** A transfer into a credit card: paying it (its balance moves towards 0). */
export function isCardPayment(
  transaction: Pick<Transaction, 'type'> & { toAccount: { type: string } | null },
): boolean {
  return isTransfer(transaction) && transaction.toAccount?.type === 'CREDIT_CARD'
}

/**
 * "Origin → Destination" with the accounts' names. An account deleted meanwhile (the
 * backend sets it to null) reads as `missing`.
 */
export function transferRoute(
  transaction: Pick<Transaction, 'account' | 'toAccount'>,
  missing: string,
): string {
  return `${transaction.account?.name ?? missing} → ${transaction.toAccount?.name ?? missing}`
}
