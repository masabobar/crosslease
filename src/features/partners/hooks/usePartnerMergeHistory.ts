import { useQuery } from "@tanstack/react-query"
import {
  fetchMergeHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerMergeHistory(partnerId: string) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.mergeHistory(partnerId),
    queryFn: () => fetchMergeHistory(partnerId),
  })
}
