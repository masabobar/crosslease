import { useQuery } from "@tanstack/react-query"
import {
  fetchTenants,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenants() {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.list(),
    queryFn: fetchTenants,
    staleTime: 5 * 60 * 1000,
  })
}
