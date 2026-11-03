// Mirrors ILoanResponse / ILoanDetailResponse (backend loans module).
// A loan is money lent to someone else.
export type LoanStatus = 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID'

export interface Loan {
  id: string
  borrowerName: string
  /** Amount originally lent. */
  amount: number
  amountRepaid: number
  /** `amount - amountRepaid`. */
  remainingAmount: number
  status: LoanStatus
  loanDate: string
  dueDate: string | null
  note: string | null
  accountId: string | null
  createdAt: string
  updatedAt: string
}

export interface LoanRepayment {
  id: string
  /** Not in the API payload — filled in by the mapper from the parent loan. */
  loanId: string
  amount: number
  paidAt: string
  note: string | null
  createdAt: string
}

/** Returned by GET /loans/:id and POST /loans/:id/repayments. */
export interface LoanDetail extends Loan {
  repayments: LoanRepayment[]
}

export interface CreateLoanInput {
  borrowerName: string
  amount: number
  loanDate: string
  dueDate?: string
  note?: string
  accountId?: string
}

/**
 * Matches UpdateLoanDto. `amount` can't go below `amountRepaid` and `loanDate` can't be
 * after the first repayment (400 otherwise); both also correct the LOAN_GIVEN movement.
 * `accountId: null` unlinks the account. The due date can be changed but not cleared.
 */
export interface UpdateLoanInput {
  borrowerName?: string
  amount?: number
  loanDate?: string
  dueDate?: string
  note?: string
  accountId?: string | null
}

export interface CreateLoanRepaymentInput {
  amount: number
  paidAt?: string
  note?: string
}
