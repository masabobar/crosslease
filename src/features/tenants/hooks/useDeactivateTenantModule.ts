import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deactivateTenantModule,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ModuleDeactivatePayload } from "@/features/tenants/api/tenantsApi"

export function useDeactivateTenantModule(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      moduleKey,
      payload,
    }: {
      moduleKey: string
      payload: ModuleDeactivatePayload
    }) => deactivateTenantModule(tenantId, moduleKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.modules(tenantId),
      })
    },
  })
}
