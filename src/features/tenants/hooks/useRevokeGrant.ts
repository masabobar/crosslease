import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  revokeGrant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { RevokeGrantPayload } from "@/features/tenants/api/tenantsApi"

export function useRevokeGrant(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      grantId,
      payload,
    }: {
      grantId: string
      payload: RevokeGrantPayload
    }) => revokeGrant(tenantId, grantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.grants(tenantId),
      })
    },
  })
}
