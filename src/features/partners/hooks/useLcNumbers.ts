import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { LcNumberListResponse } from "@/features/partners/api/schema"
import {
  fetchLcNumbers,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function useLcNumbers(
  partnerId: string
): UseQueryResult<LcNumberListResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.lcNumbers(partnerId),
    queryFn: () => fetchLcNumbers(partnerId),
  })
}
