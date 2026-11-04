import type { Account, AccountType, CreditCardState, Institution } from '@/types'

/** How "Mis productos" shows a product. */
export type ProductKind = 'account' | 'wallet' | 'cash' | 'card'

const KINDS: Record<AccountType, ProductKind> = {
  SAVINGS_ACCOUNT: 'account',
  CHECKING_ACCOUNT: 'account',
  DEBIT_CARD: 'account',
  DIGITAL_WALLET: 'wallet',
  CASH: 'cash',
  CREDIT_CARD: 'card',
}

export function productKind(type: AccountType): ProductKind {
  return KINDS[type]
}

export interface ProductGroup {
  /** Institution id, or `null` for "Sin entidad". */
  id: string | null
  name: string | null
  /** Accounts linked to it in the backend (0 lets it be deleted). */
  accountCount: number
  accounts: Account[]
}

/**
 * Products grouped by institution, alphabetical in the active language, with "Sin
 * entidad" last. Institutions without products still show (so they can be renamed or
 * deleted); "Sin entidad" only when something is in it. Accounts keep their order.
 */
export function groupProducts(
  accounts: readonly Account[],
  institutions: readonly Pick<Institution, 'id' | 'name' | 'accountCount'>[],
  locale: string,
): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const institution of institutions) {
    groups.set(institution.id, { ...institution, accounts: [] })
  }
  const unlinked: Account[] = []
  for (const account of accounts) {
    const ref = account.institution
    if (!ref) {
      unlinked.push(account)
      continue
    }
    // An institution created meanwhile may not be in the cached list yet.
    const group = groups.get(ref.id) ?? { ...ref, accountCount: 0, accounts: [] }
    group.accounts.push(account)
    group.accountCount = Math.max(group.accountCount, group.accounts.length)
    groups.set(ref.id, group)
  }
  const named = [...groups.values()].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', locale, { sensitivity: 'base' }),
  )
  return unlinked.length > 0
    ? [...named, { id: null, name: null, accountCount: 0, accounts: unlinked }]
    : named
}

export type CardSummaryKey = 'owe' | 'available' | 'overLimit' | 'limit'

export interface CardSummaryPart {
  key: CardSummaryKey
  amount: number
}

/**
 * "Debes · Disponible · Sobrecupo · Cupo" of a configured card, in that order. The
 * over-limit part only when there is one; `null` for an unconfigured card (its balance
 * doesn't say what's owed).
 */
export function cardSummaryParts(card: CreditCardState | null): CardSummaryPart[] | null {
  if (!card?.configured || card.creditLimit === null) return null
  const parts: CardSummaryPart[] = [
    { key: 'owe', amount: card.debt ?? 0 },
    { key: 'available', amount: card.available ?? 0 },
  ]
  if ((card.overLimit ?? 0) > 0) parts.push({ key: 'overLimit', amount: card.overLimit ?? 0 })
  parts.push({ key: 'limit', amount: card.creditLimit })
  return parts
}

/** "Debes $ 4.539.024 · Disponible $ 0 · Sobrecupo $ 239.024 · Cupo $ 4.300.000". */
export function formatCardSummary(
  parts: readonly CardSummaryPart[],
  label: (key: CardSummaryKey, amount: string) => string,
  money: (value: number) => string,
): string {
  return parts.map(part => label(part.key, money(part.amount))).join(' · ')
}

/** "Tarjeta débito •••• 1234" / "Tarjeta débito"; `null` without a debit card. */
export function debitCardLabel(
  account: Pick<Account, 'hasDebitCard' | 'cardLast4' | 'type'>,
  label: string,
): string | null {
  if (!account.hasDebitCard || productKind(account.type) === 'card') return null
  return account.cardLast4 ? `${label} •••• ${account.cardLast4}` : label
}
