import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  upsertIntegrationBinding,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { UpsertIntegrationBindingPayload } from "@/features/tenants/api/tenantsApi"

export function useUpsertIntegrationBinding(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertIntegrationBindingPayload) =>
      upsertIntegrationBinding(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.integrationBinding(tenantId),
      })
    },
  })
}
