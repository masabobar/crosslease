import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  reactivateTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ReactivateTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useReactivateTenant(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReactivateTenantPayload) =>
      reactivateTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
    },
  })
}
