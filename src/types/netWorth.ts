// Mirrors INetWorthResponse (backend net-worth module).
// `netWorth = totals.assets − totals.liabilities`; nothing in `info` adds up.
export interface NetWorth {
  assets: {
    /** Accounts that aren't credit cards, plus configured cards with money in favour. */
    accountsBalance: number
    /** Still owed on unpaid loans. */
    receivables: number
  }
  liabilities: {
    /** Own debts: placeholder on the backend (always 0 until the Debt model exists). */
    debts: number
    /** What's owed on cards with a configured limit. */
    creditCardsDebt: number
  }
  info: {
    /** Sum of `Goal.currentAmount`: money set aside inside the accounts, not an extra asset. */
    goalsSavings: number
    /** Available credit on configured cards. Not an asset. */
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
