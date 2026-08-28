import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CaseResponse } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, rejectCase } from "@/features/cases/api/casesApi"

// PRD1042-1794 — the bank declines an unclaimed leasing-company proposal. The request moves to
// rejected; the leasing company keeps visibility and sees it as rejected. Invalidates the list (so
// it leaves the unclaimed view) and the case detail (so the status/actions update).
export function useRejectCase(): UseMutationResult<
  CaseResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caseId: string) => rejectCase(caseId),
    onSuccess: updated => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(updated.id),
      })
    },
  })
}
