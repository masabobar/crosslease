import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TenantsResponse } from "@/features/tenants/api/schema"
import {
  fetchTenants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { TenantListParams } from "@/features/tenants/api/tenantsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTenantList(
  params: TenantListParams
): UseQueryResult<TenantsResponse, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.list(params),
    queryFn: () => fetchTenants(params),
    staleTime: THIRTY_SECONDS_MS,
  })
}
