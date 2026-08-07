import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TenantResponse } from "@/features/tenants/api/schema"
import {
  updateTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { UpdateTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useUpdateTenant(
  tenantId: string
): UseMutationResult<TenantResponse, Error, UpdateTenantPayload> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      updateTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
      // The list renders the tenant's name, so it goes stale on every identity edit.
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEYS.lists() })
    },
  })
}
