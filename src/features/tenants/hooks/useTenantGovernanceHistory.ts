import { useInfiniteQuery } from "@tanstack/react-query"
import {
  fetchGovernanceHistory,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { GovernanceHistoryParams } from "@/features/tenants/api/tenantsApi"

export function useTenantGovernanceHistory(
  id: string | null,
  params?: Omit<GovernanceHistoryParams, "cursor">
) {
  return useInfiniteQuery({
    queryKey: [...TENANTS_QUERY_KEYS.governanceHistory(id ?? ""), params],
    queryFn: ({ pageParam }) =>
      fetchGovernanceHistory(id!, {
        ...params,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!id,
  })
}
