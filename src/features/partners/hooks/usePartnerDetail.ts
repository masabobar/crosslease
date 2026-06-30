import { useQuery } from "@tanstack/react-query"
import {
  fetchPartner,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerDetail(id: string | null) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => fetchPartner(id!),
    enabled: !!id,
  })
}
