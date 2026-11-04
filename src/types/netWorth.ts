// Mirrors INetWorthResponse (backend net-worth module).
// `netWorth = totals.assets − totals.liabilities`; nothing in `info` adds up.
export interface NetWorth {
  assets: {
    /** Sum of `currentBalance` of every account that isn't a credit card. */
    accountsBalance: number
    /** Still owed on unpaid loans. */
    receivables: number
  }
  liabilities: {
    /** Placeholder on the backend (always 0 for now). */
    debts: number
    /** Placeholder on the backend (always 0 for now). */
    creditCardsDebt: number
  }
  info: {
    /** Sum of `Goal.currentAmount`: money set aside inside the accounts, not an extra asset. */
    goalsSavings: number
    /** Placeholder on the backend (always 0 for now). */
    creditCardsAvailable: number
    /** Credit cards without a configured limit: their balance stays out of the totals. */
    unconfiguredCards: UnconfiguredCard[]
  }
  totals: {
    assets: number
    liabilities: number
  }
  netWorth: number
}

export interface UnconfiguredCard {
  id: string
  name: string
  currentBalance: number
}
