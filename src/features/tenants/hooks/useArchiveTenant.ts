import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  archiveTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { ArchiveTenantPayload } from "@/features/tenants/api/tenantsApi"

export function useArchiveTenant(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ArchiveTenantPayload) =>
      archiveTenant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.detail(tenantId),
      })
      queryClient.invalidateQueries({ queryKey: ["tenants", "list"] })
    },
  })
}
