import { useState } from 'react'

import { Button } from '@/components/ui'
import { NetWorthView, type NetWorthViewProps } from '@/features/net-worth'
import type { Account, AccountType, Goal, Loan, NetWorth } from '@/types'

const STAMP = '2026-09-18T10:00:00.000Z'

function account(
  id: string,
  name: string,
  type: AccountType,
  currentBalance: number,
  withInitialBalance = true,
): Account {
  return {
    id,
    name,
    type,
    createdAt: STAMP,
    updatedAt: STAMP,
    initialBalance: withInitialBalance ? currentBalance : 0,
    initialBalanceDate: withInitialBalance ? STAMP : null,
    currentBalance,
  }
}

function loan(id: string, borrowerName: string, amount: number, amountRepaid: number): Loan {
  return {
    id,
    borrowerName,
    amount,
    amountRepaid,
    remainingAmount: amount - amountRepaid,
    status: amountRepaid >= amount ? 'PAID' : amountRepaid > 0 ? 'PARTIALLY_PAID' : 'ACTIVE',
    loanDate: STAMP,
    dueDate: null,
    note: null,
    accountId: null,
    createdAt: STAMP,
    updatedAt: STAMP,
  }
}

function goal(id: string, name: string, currentAmount: number): Goal {
  return {
    id,
    name,
    targetAmount: 10_000_000,
    currentAmount,
    percentage: currentAmount / 100_000,
    targetDate: '2027-06-01T17:00:00.000Z',
    phase: 'PHASE_2_OPTIMIZATION',
    status: 'ACTIVE',
    plan: null,
    contributions: [],
    createdAt: STAMP,
    updatedAt: STAMP,
  }
}

/** /net-worth computed from the rows with the backend's formulas, so subtotals reconcile. */
function netWorthOf(accounts: Account[], loans: Loan[], goals: Goal[]): NetWorth {
  const accountsBalance = accounts.reduce((sum, item) => sum + item.currentBalance, 0)
  const receivables = loans
    .filter(item => item.status !== 'PAID')
    .reduce((sum, item) => sum + item.remainingAmount, 0)
  const goalsSavings = goals.reduce((sum, item) => sum + item.currentAmount, 0)
  return {
    assets: { accountsBalance, receivables, goalsSavings, creditCardsAvailable: 0 },
    liabilities: { debts: 0, creditCardsDebt: 0 },
    netWorth: accountsBalance + receivables + goalsSavings,
  }
}

const noop = () => undefined
const ok = <T,>(data: T) => ({ data, isPending: false, isError: false, refetch: noop })
const failed = { data: undefined, isPending: false, isError: true, refetch: noop }
const pending = { data: undefined, isPending: true, isError: false, refetch: noop }

function scenario(accounts: Account[], loans: Loan[], goals: Goal[]): NetWorthViewProps {
  return {
    netWorth: ok(netWorthOf(accounts, loans, goals)),
    accounts: ok(accounts),
    loans: ok(loans),
    goals: ok(goals),
  }
}

const TYPICAL = scenario(
  [
    account('a1', 'Ahorros Bancolombia', 'DEBIT_CARD', 14_810_463.22),
    account('a2', 'Nequi', 'SAVINGS_ACCOUNT', 1_968.34),
    account('a3', 'Efectivo', 'CASH', 0),
  ],
  [loan('l1', 'Yeison Soto', 4_000_000, 1_500_000), loan('l2', 'Ana', 300_000, 300_000)],
  [goal('g1', 'Viaje internacional', 1_200_000), goal('g2', 'Carro', 0)],
)

const MANY = scenario(
  [
    account('m1', 'Ahorros Bancolombia', 'DEBIT_CARD', 6_400_000),
    account(
      'm2',
      'Cuenta de ahorros Davivienda con un nombre bastante largo',
      'SAVINGS_ACCOUNT',
      2_150_000,
    ),
    account('m3', 'Nequi', 'SAVINGS_ACCOUNT', 380_500),
    account('m4', 'Daviplata', 'SAVINGS_ACCOUNT', 92_000, false),
    account('m5', 'Efectivo', 'CASH', 145_000),
    account('m6', 'Bolsillo viajes', 'SAVINGS_ACCOUNT', 1_000_000),
    account('m7', 'Caja menor', 'CASH', 25_000, false),
    account('m8', 'TC VISA Clásica', 'CREDIT_CARD', 1_007_408),
  ],
  [loan('n1', 'Yeison Soto', 4_000_000, 1_500_000), loan('n2', 'Laura', 25_000, 0)],
  [goal('h1', 'Viaje internacional', 3_000_000), goal('h2', 'Carro', 1_000_000)],
)

const NEGATIVE = scenario(
  [
    account('x1', 'Ahorros Bancolombia', 'DEBIT_CARD', -1_850_000),
    account('x2', 'Efectivo', 'CASH', 120_000, false),
  ],
  [loan('y1', 'Yeison Soto', 400_000, 100_000)],
  [],
)

const EMPTY = scenario([], [], [])

const SCENARIOS = {
  typical: TYPICAL,
  many: MANY,
  negative: NEGATIVE,
  empty: EMPTY,
  netWorthFailed: { ...TYPICAL, netWorth: failed },
  listsFailed: { ...TYPICAL, accounts: failed, loans: failed, goals: failed },
  loading: { netWorth: pending, accounts: pending, loans: pending, goals: pending },
} satisfies Record<string, NetWorthViewProps>

export type NetWorthScenario = keyof typeof SCENARIOS

/** The real net worth screen over mock states; picking a scenario sends no request. */
export function NetWorthShowcase({ labels }: { labels: Record<NetWorthScenario, string> }) {
  const [current, setCurrent] = useState<NetWorthScenario>('typical')

  return (
    <div className="space-y-6">
      <div role="group" aria-label="scenario" className="flex flex-wrap gap-2">
        {(Object.keys(SCENARIOS) as NetWorthScenario[]).map(key => (
          <Button
            key={key}
            size="sm"
            variant={key === current ? 'secondary' : 'ghost'}
            aria-pressed={key === current}
            onClick={() => setCurrent(key)}
          >
            {labels[key]}
          </Button>
        ))}
      </div>
      <div className="rounded-card border border-dashed border-line p-4 sm:p-6">
        <NetWorthView key={current} {...SCENARIOS[current]} />
      </div>
    </div>
  )
}
