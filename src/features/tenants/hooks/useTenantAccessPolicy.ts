import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { AccessPolicyResponse } from "@/features/tenants/api/schema"
import {
  fetchAccessPolicy,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantAccessPolicy(
  id: string | null
): UseQueryResult<AccessPolicyResponse, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.accessPolicy(id ?? ""),
    queryFn: () => fetchAccessPolicy(id!),
    enabled: !!id,
  })
}
