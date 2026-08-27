import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CaseListResponse } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, fetchCases } from "@/features/cases/api/casesApi"
import type { CaseListParams } from "@/features/cases/api/casesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// The operational Case list (PRD1042-1794 DRC usability). Keyed by the filter params so a toggle
// flip refetches; a short staleTime keeps the list responsive without hammering the endpoint, and
// placeholderData holds the previous page while the next request settles.
export function useCases(
  params: CaseListParams
): UseQueryResult<CaseListResponse, Error> {
  return useQuery({
    queryKey: CASE_QUERY_KEYS.list(params),
    queryFn: () => fetchCases(params),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
