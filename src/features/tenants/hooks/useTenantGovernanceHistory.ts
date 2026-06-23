import { useQuery } from "@tanstack/react-query"
import {
  fetchGovernanceHistory,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { GovernanceHistoryParams } from "@/features/tenants/api/tenantsApi"

export function useTenantGovernanceHistory(
  id: string | null,
  params?: GovernanceHistoryParams
) {
  return useQuery({
    queryKey: [...TENANTS_QUERY_KEYS.governanceHistory(id ?? ""), params],
    queryFn: () => fetchGovernanceHistory(id!, params),
    enabled: !!id,
  })
}
