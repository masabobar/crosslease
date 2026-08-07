import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TenantDetailModulesResponse } from "@/features/tenants/api/schema"
import {
  fetchTenantModules,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantModules(
  id: string | null
): UseQueryResult<TenantDetailModulesResponse, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.modules(id ?? ""),
    queryFn: () => fetchTenantModules(id!),
    enabled: !!id,
  })
}
