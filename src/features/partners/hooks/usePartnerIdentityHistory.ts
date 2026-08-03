import { useQuery } from "@tanstack/react-query"
import {
  fetchIdentityHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerIdentityHistory(partnerId: string) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.identityHistory(partnerId),
    queryFn: () => fetchIdentityHistory(partnerId),
  })
}
