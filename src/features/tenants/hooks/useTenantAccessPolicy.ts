import { useQuery } from "@tanstack/react-query"
import {
  fetchAccessPolicy,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantAccessPolicy(id: string | null) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.accessPolicy(id ?? ""),
    queryFn: () => fetchAccessPolicy(id!),
    enabled: !!id,
  })
}
