import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseContractTotals,
  submitCase,
} from "@/features/cases/api/casesApi"
import type {
  PackageTotalsRead,
  SubmitResultResponse,
} from "@/features/cases/api/schema"

/**
 * Submits the refinancing request (US 1.17).
 *
 * Invalidates the case list as well as the case itself: submission moves the request out of `draft`,
 * which changes the row's derived display status and can move it between work-list views — so a
 * stale list would show the case as still a draft.
 */
export function useSubmitCase(): UseMutationResult<
  SubmitResultResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caseId: string) => submitCase(caseId),
    onSuccess: (_result, caseId) => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(caseId),
      })
    },
  })
}

// GET /cases/{case_id}/contracts/totals — the summary's contract count and money sums.
export function useCaseContractTotals(caseId: string | undefined) {
  return useQuery<PackageTotalsRead>({
    queryKey: CASE_QUERY_KEYS.contractTotals(caseId ?? ""),
    queryFn: () => fetchCaseContractTotals(caseId as string),
    enabled: Boolean(caseId),
  })
}
