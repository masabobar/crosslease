import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { SupportGrant } from "@/features/tenants/api/schema"
import {
  fetchSupportGrants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantGrants(
  id: string | null
): UseQueryResult<SupportGrant[], Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.grants(id ?? ""),
    queryFn: () => fetchSupportGrants(id!),
    enabled: !!id,
  })
}
