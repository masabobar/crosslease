import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import {
  activateTenantModule,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ModuleActivatePayload } from "@/features/tenants/api/tenantsApi"

type ActivateTenantModuleInput = {
  moduleKey: string
  payload: ModuleActivatePayload
}

export function useActivateTenantModule(
  tenantId: string
): UseMutationResult<GovernedAction, Error, ActivateTenantModuleInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleKey, payload }: ActivateTenantModuleInput) =>
      activateTenantModule(tenantId, moduleKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.modules(tenantId),
      })
    },
  })
}
