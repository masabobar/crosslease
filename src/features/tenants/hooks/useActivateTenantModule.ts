import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  activateTenantModule,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ModuleActivatePayload } from "@/features/tenants/api/tenantsApi"

export function useActivateTenantModule(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      moduleKey,
      payload,
    }: {
      moduleKey: string
      payload: ModuleActivatePayload
    }) => activateTenantModule(tenantId, moduleKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.modules(tenantId),
      })
    },
  })
}
