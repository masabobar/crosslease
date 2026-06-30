import { useQuery } from "@tanstack/react-query"
import {
  fetchPartners,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { PartnerListParams } from "@/features/partners/api/partnersApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function usePartnerList(params: PartnerListParams) {
  const normalizedParams: PartnerListParams = {
    ...params,
    search:
      params.search && params.search.length >= 3 ? params.search : undefined,
  }

  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchPartners(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
