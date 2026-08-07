import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  deactivateTenantModule,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ModuleDeactivatePayload } from "@/features/tenants/api/tenantsApi"

type DeactivateTenantModuleInput = {
  moduleKey: string
  payload: ModuleDeactivatePayload
}

export function useDeactivateTenantModule(
  tenantId: string
): UseMutationResult<void, Error, DeactivateTenantModuleInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleKey, payload }: DeactivateTenantModuleInput) =>
      deactivateTenantModule(tenantId, moduleKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.modules(tenantId),
      })
    },
  })
}
