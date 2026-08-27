import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CaseResponse } from "@/features/cases/api/schema"
import { CASE_QUERY_KEYS, fetchCase } from "@/features/cases/api/casesApi"

// A single case for the detail header. Disabled until an id exists: an absent one means the route
// param was not a UUID (guarded upstream) rather than that the caller forgot to pass it.
export function useCase(
  caseId: string | undefined
): UseQueryResult<CaseResponse, Error> {
  return useQuery({
    queryKey: CASE_QUERY_KEYS.detail(caseId ?? ""),
    queryFn: () => fetchCase(caseId as string),
    enabled: Boolean(caseId),
  })
}
