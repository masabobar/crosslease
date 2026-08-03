import { useQuery } from "@tanstack/react-query"
import {
  fetchPartnerUbo,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerUbo(partnerId: string) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.ubo(partnerId),
    queryFn: () => fetchPartnerUbo(partnerId),
  })
}
