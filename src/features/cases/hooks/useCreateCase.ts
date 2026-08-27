import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CaseResponse, CaseType } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, createCase } from "@/features/cases/api/casesApi"

// PRD1042-1794 (DRC usability) — start a case from the UI. Without this there is no way to open a
// case, and the whole upload → review → gate flow has no entry point (the required-documents surface
// hangs off a case). Invalidates the list key so the new case appears immediately; the caller
// navigates to the new case's detail (Documents tab) using the returned id.
export function useCreateCase(): UseMutationResult<
  CaseResponse,
  Error,
  CaseType
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (caseType: CaseType) => createCase(caseType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CASE_QUERY_KEYS.all })
    },
  })
}
