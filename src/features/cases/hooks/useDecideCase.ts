import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { CASE_QUERY_KEYS, decideCase } from "@/features/cases/api/casesApi"
import type { CaseResponse } from "@/features/cases/api/schema"
import type { DecisionOutcome } from "@/features/cases/decisionOutcomes"

/**
 * Records the step-4 decision (US 1.29).
 *
 * Invalidates broadly on purpose. The decision is the hinge of the whole process: it changes the
 * request's status and therefore the case's derived display status, it moves the case between work
 * lists, it is an auditable event, and on approval it is the moment a financing comes into
 * existence (US 1.32) — so the financing queries are invalidated too rather than left holding a
 * "no financing yet" answer that has just stopped being true.
 */
export function useDecideCase(): UseMutationResult<
  CaseResponse,
  Error,
  { caseId: string; outcome: DecisionOutcome; reason: string | null }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, outcome, reason }) =>
      decideCase(caseId, outcome, reason),
    onSuccess: (_updated, { caseId }) => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: ["cases", "activity", caseId],
      })
      // The approval is what brings a financing into being — see US 1.32.
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.leasingCompany(caseId),
      })
      void queryClient.invalidateQueries({ queryKey: ["financing"] })
    },
  })
}
