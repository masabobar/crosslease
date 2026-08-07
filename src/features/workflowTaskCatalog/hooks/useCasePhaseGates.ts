import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PhaseGatesResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  fetchCasePhaseGates,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// Returns only the gates that exist — a gate row is created lazily on first decision. An empty
// array is therefore a legitimate, non-error state meaning "no phase has been decided yet", and is
// distinct from the checklist's 404.
export function useCasePhaseGates(
  businessObjectId: string | undefined
): UseQueryResult<PhaseGatesResponse, Error> {
  return useQuery({
    queryKey: CASE_CHECKLIST_QUERY_KEYS.phaseGates(businessObjectId ?? ""),
    queryFn: () => fetchCasePhaseGates(businessObjectId as string),
    enabled: Boolean(businessObjectId),
    staleTime: THIRTY_SECONDS_MS,
  })
}
