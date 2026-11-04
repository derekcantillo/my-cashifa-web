// Own debts (Debt model) are phase 2 of docs/design-liabilities.md: `/net-worth` still
// returns `liabilities.debts` fixed at 0, so the screen says they aren't tracked instead
// of showing "$0". Credit card debt is real (`creditCardsDebt`, cards with a limit).
// Set this to `true` when debts exist.
export const DEBTS_IMPLEMENTED = false
