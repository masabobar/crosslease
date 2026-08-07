import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"
import {
  fetchPartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerDetail(
  id: string | null
): UseQueryResult<PartnerDetailResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => fetchPartner(id!),
    enabled: !!id,
  })
}
