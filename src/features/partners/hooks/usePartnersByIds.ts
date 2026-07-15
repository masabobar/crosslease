import { useQueries } from "@tanstack/react-query"
import {
  fetchPartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import type { PartnerDetailResponse } from "@/features/partners/api/schema"

export function usePartnersByIds(ids: string[]): {
  partnersById: Map<string, PartnerDetailResponse>
  isLoading: boolean
} {
  const uniqueIds = Array.from(new Set(ids))

  const results = useQueries({
    queries: uniqueIds.map(id => ({
      queryKey: PARTNERS_QUERY_KEYS.detail(id),
      queryFn: () => fetchPartner(id),
    })),
  })

  const partnersById = new Map<string, PartnerDetailResponse>()
  results.forEach((result, i) => {
    if (result.data) partnersById.set(uniqueIds[i], result.data)
  })

  return {
    partnersById,
    isLoading: results.some(r => r.isLoading),
  }
}
