import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PartnerRolesResponse } from "@/features/partners/api/schema"
import {
  fetchPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerRoles(
  partnerId: string | null
): UseQueryResult<PartnerRolesResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.roles(partnerId ?? ""),
    queryFn: () => fetchPartnerRoles(partnerId!),
    enabled: !!partnerId,
  })
}
