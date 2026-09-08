import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { CASE_QUERY_KEYS, transitionCase } from "@/features/cases/api/casesApi"
import type { CaseResponse } from "@/features/cases/api/schema"
import type { CaseTransition } from "@/features/cases/caseTransitions"

/**
 * Moves a case through its lifecycle (US 1.30, US 1.31).
 *
 * Invalidates the list as well as the case: every one of these transitions changes the derived
 * display status, and three of them move the case between work lists — so a stale list would show
 * it where it no longer belongs. The activity trail gains a row for each.
 */
export function useTransitionCase(): UseMutationResult<
  CaseResponse,
  Error,
  { caseId: string; transition: CaseTransition }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, transition }) => transitionCase(caseId, transition),
    onSuccess: (_updated, { caseId }) => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: ["cases", "activity", caseId],
      })
    },
  })
}
