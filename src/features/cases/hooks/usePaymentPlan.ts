import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchPaymentPlan,
  generatePaymentPlan,
  setManualPaymentPlan,
} from "@/features/cases/api/casesApi"
import type { PaymentPlanResponse } from "@/features/cases/api/schema"

/**
 * A contract's payment plan (US 1.11).
 *
 * `retry: false`: a contract with no financing component has no plan, and the endpoint answers 404
 * for it. That is an ordinary state on a request still being assembled — the plan exists once the
 * component does — so it must not be retried three times before the empty state appears.
 */
export function usePaymentPlan(
  caseId: string | undefined,
  contractId: string | undefined
) {
  return useQuery<PaymentPlanResponse>({
    queryKey: CASE_QUERY_KEYS.paymentPlan(caseId ?? "", contractId ?? ""),
    queryFn: () => fetchPaymentPlan(caseId as string, contractId as string),
    enabled: Boolean(caseId) && Boolean(contractId),
    retry: false,
  })
}

export function useGeneratePaymentPlan(): UseMutationResult<
  PaymentPlanResponse,
  Error,
  { caseId: string; contractId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, contractId }) =>
      generatePaymentPlan(caseId, contractId),
    // Written straight into the cache as well as invalidated: the response IS the new plan, so
    // showing it immediately avoids a refetch that would return the same rows.
    onSuccess: (plan, { caseId, contractId }) => {
      queryClient.setQueryData(
        CASE_QUERY_KEYS.paymentPlan(caseId, contractId),
        plan
      )
    },
  })
}

export function useSetManualPaymentPlan(): UseMutationResult<
  PaymentPlanResponse,
  Error,
  {
    caseId: string
    contractId: string
    rows: { due_date: string; amount: string; is_final: boolean }[]
  }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, contractId, rows }) =>
      setManualPaymentPlan(caseId, contractId, rows),
    onSuccess: (plan, { caseId, contractId }) => {
      queryClient.setQueryData(
        CASE_QUERY_KEYS.paymentPlan(caseId, contractId),
        plan
      )
    },
  })
}
