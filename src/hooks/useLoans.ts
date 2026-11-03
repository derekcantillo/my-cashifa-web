import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { loansRepository } from '@/api/loans'
import { queryKeys } from '@/lib/queryKeys'
import type {
  CreateLoanInput,
  CreateLoanRepaymentInput,
  Loan,
  LoanDetail,
  UpdateLoanInput,
} from '@/types'

import { invalidateFinancialState, invalidateQueries } from './invalidation'
import { skipUnless } from './skipUnless'

export function useLoans() {
  return useQuery({
    queryKey: queryKeys.loans.all,
    queryFn: () => loansRepository.list(),
  })
}

export function useLoan(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.loans.detail(id),
    queryFn: skipUnless(id, loanId => loansRepository.getById(loanId)),
  })
}

// Creating a loan or a repayment writes a LOAN_GIVEN / LOAN_REPAYMENT transaction in
// the period of its date: it moves the loan's account balance and net worth
// (receivables), and shows up in Gastos — but it's neither spending nor income, so the
// ledger and budgets don't change. Refetches aren't awaited: modals close as soon as the
// write succeeds.

export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLoanInput) => loansRepository.create(input),
    onSuccess: () => {
      void invalidateQueries(queryClient, queryKeys.loans.all)
      void invalidateFinancialState(queryClient)
    },
  })
}

export function useCreateLoanRepayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateLoanRepaymentInput }) =>
      loansRepository.addRepayment(id, input),
    onSuccess: loan => {
      // The response is the updated loan with its repayments (maybe now PAID).
      queryClient.setQueryData(queryKeys.loans.detail(loan.id), loan)
      queryClient.setQueryData<Loan[]>(queryKeys.loans.all, loans =>
        loans?.map(item => (item.id === loan.id ? { ...item, ...stripRepayments(loan) } : item)),
      )
      void invalidateQueries(queryClient, queryKeys.loans.all)
      void invalidateFinancialState(queryClient)
    },
  })
}

/**
 * Editing the amount, loan date or account also corrects the LOAN_GIVEN movement on the
 * backend (and the status, from the new amount): loans, movements, account balances
 * and net worth all refresh.
 */
export function useUpdateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLoanInput }) =>
      loansRepository.update(id, input),
    onSuccess: () => {
      void invalidateQueries(queryClient, queryKeys.loans.all)
      void invalidateFinancialState(queryClient)
    },
  })
}

/**
 * Deleting a loan cascades to its transactions on the backend. Only the list is
 * invalidated (exact key): the deleted loan's detail query is left alone so the page
 * still showing it doesn't refetch a 404 before navigating away.
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => loansRepository.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Loan[]>(queryKeys.loans.all, loans =>
        loans?.filter(loan => loan.id !== id),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.loans.all, exact: true })
      void invalidateFinancialState(queryClient)
    },
  })
}

function stripRepayments(loan: LoanDetail): Loan {
  const { repayments, ...rest } = loan
  void repayments
  return rest
}
