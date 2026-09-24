import { parseAmount } from '@/lib/parseAmount'
import type {
  CreateLoanInput,
  CreateLoanRepaymentInput,
  Loan,
  LoanDetail,
  LoanRepayment,
  LoanStatus,
  UpdateLoanInput,
} from '@/types'

import { apiClient } from './client'
import type { RawAmount } from './mappers'

interface RawLoan {
  id: string
  borrowerName: string
  amount: RawAmount
  amountRepaid: RawAmount
  remainingAmount: RawAmount
  status: LoanStatus
  loanDate: string
  dueDate: string | null
  note: string | null
  accountId: string | null
  createdAt: string
  updatedAt: string
}

interface RawLoanRepayment {
  id: string
  amount: RawAmount
  paidAt: string
  note: string | null
  createdAt: string
}

interface RawLoanDetail extends RawLoan {
  repayments: RawLoanRepayment[]
}

function toLoan(raw: RawLoan): Loan {
  return {
    id: raw.id,
    borrowerName: raw.borrowerName,
    amount: parseAmount(raw.amount),
    amountRepaid: parseAmount(raw.amountRepaid),
    remainingAmount: parseAmount(raw.remainingAmount),
    status: raw.status,
    loanDate: raw.loanDate,
    dueDate: raw.dueDate,
    note: raw.note,
    accountId: raw.accountId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

function toLoanRepayment(raw: RawLoanRepayment, loanId: string): LoanRepayment {
  return { ...raw, loanId, amount: parseAmount(raw.amount) }
}

function toLoanDetail(raw: RawLoanDetail): LoanDetail {
  return {
    ...toLoan(raw),
    repayments: raw.repayments.map(repayment => toLoanRepayment(repayment, raw.id)),
  }
}

export interface LoansRepository {
  list(): Promise<Loan[]>
  getById(id: string): Promise<LoanDetail>
  create(input: CreateLoanInput): Promise<Loan>
  addRepayment(id: string, input: CreateLoanRepaymentInput): Promise<LoanDetail>
  update(id: string, input: UpdateLoanInput): Promise<Loan>
  remove(id: string): Promise<void>
}

const httpLoansRepository: LoansRepository = {
  async list() {
    const { data } = await apiClient.get<RawLoan[]>('/loans')
    return data.map(toLoan)
  },
  async getById(id) {
    const { data } = await apiClient.get<RawLoanDetail>(`/loans/${id}`)
    return toLoanDetail(data)
  },
  async create(input) {
    const { data } = await apiClient.post<RawLoan>('/loans', input)
    return toLoan(data)
  },
  async addRepayment(id, input) {
    const { data } = await apiClient.post<RawLoanDetail>(`/loans/${id}/repayments`, input)
    return toLoanDetail(data)
  },
  async update(id, input) {
    const { data } = await apiClient.patch<RawLoan>(`/loans/${id}`, input)
    return toLoan(data)
  },
  async remove(id) {
    await apiClient.delete(`/loans/${id}`)
  },
}

export const loansRepository: LoansRepository = httpLoansRepository
