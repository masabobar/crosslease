import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TenantsResponse } from "@/features/tenants/api/schema"
import {
  fetchTenants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useTenants(
  enabled = true
): UseQueryResult<TenantsResponse, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.list(),
    queryFn: () => fetchTenants(),
    staleTime: FIVE_MINUTES_MS,
    enabled,
  })
}
