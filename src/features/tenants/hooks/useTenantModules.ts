import { useQuery } from "@tanstack/react-query"
import {
  fetchTenantModules,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantModules(id: string | null) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.modules(id ?? ""),
    queryFn: () => fetchTenantModules(id!),
    enabled: !!id,
  })
}
