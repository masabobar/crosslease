import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { IdentityHistoryResponse } from "@/features/partners/api/schema"
import {
  fetchIdentityHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerIdentityHistory(
  partnerId: string
): UseQueryResult<IdentityHistoryResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.identityHistory(partnerId),
    queryFn: () => fetchIdentityHistory(partnerId),
  })
}
