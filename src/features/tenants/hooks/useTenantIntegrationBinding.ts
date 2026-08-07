import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { IntegrationBindingResponse } from "@/features/tenants/api/schema"
import {
  fetchIntegrationBinding,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useTenantIntegrationBinding(
  id: string | null
): UseQueryResult<IntegrationBindingResponse, Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEYS.integrationBinding(id ?? ""),
    queryFn: () => fetchIntegrationBinding(id!),
    enabled: !!id,
  })
}
