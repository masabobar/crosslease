import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ResolutionCandidatesResponse } from "@/features/partners/api/schema"
import {
  fetchResolutionCandidates,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function useResolutionCandidates(
  partnerId: string
): UseQueryResult<ResolutionCandidatesResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.resolutionCandidates(partnerId),
    queryFn: () => fetchResolutionCandidates(partnerId),
  })
}
