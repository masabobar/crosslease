import { useQuery } from "@tanstack/react-query"
import {
  fetchSupportGrants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantGrants(id: string | null) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.grants(id ?? ""),
    queryFn: () => fetchSupportGrants(id!),
    enabled: !!id,
  })
}
