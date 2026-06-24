import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { UpdateTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useUpdateTenant(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      updateTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
    },
  })
}
