import { useQuery } from "@tanstack/react-query"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  fetchCaseRequiredProjection,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"

// Same 404-on-unmaterialized behaviour as the checklist itself, so the same retry policy. This
// projection is what CR B6 intends the gating engine to read; until that engine exists the
// outstanding-tasks notice on the checklist screen is its only consumer.
export function useCaseRequiredProjection(
  businessObjectId: string | undefined
) {
  return useQuery({
    queryKey: CASE_CHECKLIST_QUERY_KEYS.required(businessObjectId ?? ""),
    queryFn: () => fetchCaseRequiredProjection(businessObjectId as string),
    enabled: Boolean(businessObjectId),
    retry: false,
  })
}
