import { useQuery } from "@tanstack/react-query"
import {
  fetchTenantDetail,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantDetail(id: string | null) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => fetchTenantDetail(id!),
    enabled: !!id,
  })
}
