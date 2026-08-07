import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { RequiredProjectionResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  fetchCaseRequiredProjection,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// Same 404-on-unmaterialized behaviour as the checklist itself, so the same retry policy. This
// projection is what CR B6 intends the gating engine to read; until that engine exists the
// outstanding-tasks notice on the checklist screen is its only consumer.
export function useCaseRequiredProjection(
  businessObjectId: string | undefined
): UseQueryResult<RequiredProjectionResponse, Error> {
  return useQuery({
    queryKey: CASE_CHECKLIST_QUERY_KEYS.required(businessObjectId ?? ""),
    queryFn: () => fetchCaseRequiredProjection(businessObjectId as string),
    enabled: Boolean(businessObjectId),
    retry: false,
    staleTime: THIRTY_SECONDS_MS,
  })
}
