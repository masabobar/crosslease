import { useQuery } from "@tanstack/react-query"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  fetchCaseChecklist,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"

// `retry: false` because the expected failure here is WTC_CHECKLIST_NOT_FOUND — a case whose
// checklist has not been materialized. Retrying a 404 three times just delays the empty state.
export function useCaseChecklist(businessObjectId: string | undefined) {
  return useQuery({
    queryKey: CASE_CHECKLIST_QUERY_KEYS.checklist(businessObjectId ?? ""),
    queryFn: () => fetchCaseChecklist(businessObjectId as string),
    enabled: Boolean(businessObjectId),
    retry: false,
  })
}
