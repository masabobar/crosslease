import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TenantResponse } from "@/features/tenants/api/schema"
import {
  updateTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { EditLicenceLimitsForm } from "@/features/tenants/api/schema"

export function useUpdateLicenceLimits(
  tenantId: string
): UseMutationResult<TenantResponse, Error, EditLicenceLimitsForm> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EditLicenceLimitsForm) =>
      updateTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
    },
  })
}
