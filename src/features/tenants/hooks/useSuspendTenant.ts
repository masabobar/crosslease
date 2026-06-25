import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  suspendTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { SuspendTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useSuspendTenant(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SuspendTenantPayload) =>
      suspendTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEYS.list() })
    },
  })
}
