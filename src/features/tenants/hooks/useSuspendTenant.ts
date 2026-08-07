import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import {
  suspendTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { SuspendTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useSuspendTenant(
  tenantId: string
): UseMutationResult<GovernedAction, Error, SuspendTenantPayload> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SuspendTenantPayload) =>
      suspendTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEYS.lists() })
    },
  })
}
