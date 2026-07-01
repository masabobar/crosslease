import { useQuery } from "@tanstack/react-query"
import {
  fetchPartners,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { PartnerListParams } from "@/features/partners/api/partnersApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function usePartners(params?: PartnerListParams) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.list(params),
    queryFn: () => fetchPartners(params),
    staleTime: THIRTY_SECONDS_MS,
  })
}
