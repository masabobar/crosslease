import { useQuery } from "@tanstack/react-query"
import {
  fetchTenants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { TenantListParams } from "@/features/tenants/api/tenantsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTenantList(params: TenantListParams) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.list(params),
    queryFn: () => fetchTenants(params),
    staleTime: THIRTY_SECONDS_MS,
  })
}
