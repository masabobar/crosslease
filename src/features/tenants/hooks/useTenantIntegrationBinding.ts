import { useQuery } from "@tanstack/react-query"
import {
  fetchIntegrationBinding,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantIntegrationBinding(id: string | null) {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.integrationBinding(id ?? ""),
    queryFn: () => fetchIntegrationBinding(id!),
    enabled: !!id,
  })
}
