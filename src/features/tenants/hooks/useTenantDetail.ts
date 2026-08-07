import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TenantDetail } from "@/features/tenants/api/schema"
import {
  fetchTenantDetail,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantDetail(
  id: string | null
): UseQueryResult<TenantDetail, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => fetchTenantDetail(id!),
    enabled: !!id,
  })
}
