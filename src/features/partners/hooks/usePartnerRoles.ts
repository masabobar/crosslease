import { useQuery } from "@tanstack/react-query"
import {
  fetchPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerRoles(partnerId: string | null) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.roles(partnerId ?? ""),
    queryFn: () => fetchPartnerRoles(partnerId!),
    enabled: !!partnerId,
  })
}
