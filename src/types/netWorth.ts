// Mirrors INetWorthResponse (backend net-worth module).
export interface NetWorth {
  assets: {
    /** Sum of every account's `currentBalance`. */
    accountsBalance: number
    /** Still owed on unpaid loans. */
    receivables: number
    /** Sum of `Goal.currentAmount`. */
    goalsSavings: number
    /** Placeholder on the backend (always 0 for now). */
    creditCardsAvailable: number
  }
  liabilities: {
    /** Placeholder on the backend (always 0 for now). */
    debts: number
    creditCardsDebt: number
  }
  netWorth: number
}
