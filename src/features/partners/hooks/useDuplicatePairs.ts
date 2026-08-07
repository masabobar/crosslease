import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { DuplicatePairListResponse } from "@/features/partners/api/schema"
import {
  fetchDuplicatePairs,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useDuplicatePairs(
  tenantId: string | null
): UseQueryResult<DuplicatePairListResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.duplicatePairs(tenantId),
    queryFn: () => fetchDuplicatePairs(tenantId as string),
    enabled: !!tenantId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
