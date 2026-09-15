import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CaseResponse } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, assignCase } from "@/features/cases/api/casesApi"

/**
 * Assign the case to a named person.
 *
 * Invalidates the list as well as the detail: `assignee_id` is a list filter, so a case that has
 * just changed hands belongs in a different filtered view than the one the user is looking at.
 */
export function useAssignCase(
  caseId: string
): UseMutationResult<CaseResponse, Error, string> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assigneeId: string) => assignCase(caseId, assigneeId),
    onSuccess: updated => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(updated.id),
      })
    },
  })
}
