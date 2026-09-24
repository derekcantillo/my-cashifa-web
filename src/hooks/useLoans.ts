import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { loansRepository } from '@/api/loans'
import { queryKeys } from '@/lib/queryKeys'
import type { CreateLoanInput, CreateLoanRepaymentInput, UpdateLoanInput } from '@/types'

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

// Creating a loan or a repayment writes a LOAN_GIVEN / LOAN_REPAYMENT transaction,
// which moves account balances and net worth (receivables).

export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLoanInput) => loansRepository.create(input),
    onSuccess: () =>
      Promise.all([
        invalidateQueries(queryClient, queryKeys.loans.all),
        invalidateFinancialState(queryClient),
      ]),
  })
}

export function useCreateLoanRepayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateLoanRepaymentInput }) =>
      loansRepository.addRepayment(id, input),
    onSuccess: () =>
      Promise.all([
        invalidateQueries(queryClient, queryKeys.loans.all),
        invalidateFinancialState(queryClient),
      ]),
  })
}

/** Only name, due date and note are editable — no balance effect. */
export function useUpdateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLoanInput }) =>
      loansRepository.update(id, input),
    onSuccess: () => invalidateQueries(queryClient, queryKeys.loans.all),
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.loans.all, exact: true }),
        invalidateFinancialState(queryClient),
      ]),
  })
}
