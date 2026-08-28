import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CaseListResponse } from "@/features/cases/api/schema"
import {
  CASE_QUERY_KEYS,
  CASE_LIST_LIMIT,
  fetchLcCases,
} from "@/features/cases/api/casesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// The leasing company's own cases (its raised proposals) — PRD1042-1794 / 1917. Newest first so a
// just-raised proposal is at the top. Scoped to the caller's LC by the backend.
export function useLcCases(): UseQueryResult<CaseListResponse, Error> {
  const params = { limit: CASE_LIST_LIMIT, oldest_first: false }
  return useQuery({
    queryKey: CASE_QUERY_KEYS.lcList(params),
    queryFn: () => fetchLcCases(params),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
