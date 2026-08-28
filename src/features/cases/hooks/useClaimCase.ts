import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CaseResponse } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, claimCase } from "@/features/cases/api/casesApi"

// PRD1042-1917 — Front Office takes over an unclaimed LC proposal. Invalidates the list (so the
// claimed case leaves the unclaimed view) and the specific case detail (so the owner/actions update).
export function useClaimCase(): UseMutationResult<CaseResponse, Error, string> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (caseId: string) => claimCase(caseId),
    onSuccess: updated => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(updated.id),
      })
    },
  })
}
