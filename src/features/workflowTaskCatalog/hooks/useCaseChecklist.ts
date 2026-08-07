import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ChecklistResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  fetchCaseChecklist,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// `retry: false` because the expected failure here is WTC_CHECKLIST_NOT_FOUND — a case whose
// checklist has not been materialized. Retrying a 404 three times just delays the empty state.
export function useCaseChecklist(
  businessObjectId: string | undefined
): UseQueryResult<ChecklistResponse, Error> {
  return useQuery({
    queryKey: CASE_CHECKLIST_QUERY_KEYS.checklist(businessObjectId ?? ""),
    queryFn: () => fetchCaseChecklist(businessObjectId as string),
    enabled: Boolean(businessObjectId),
    retry: false,
    // Matches every catalogue query in this feature, so a tab switch does not refetch a
    // checklist the user is still reading.
    staleTime: THIRTY_SECONDS_MS,
  })
}
