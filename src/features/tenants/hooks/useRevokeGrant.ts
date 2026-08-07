import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { SupportGrant } from "@/features/tenants/api/schema"
import {
  revokeGrant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { RevokeGrantPayload } from "@/features/tenants/api/tenantsApi"

type RevokeGrantInput = {
  grantId: string
  payload: RevokeGrantPayload
}

export function useRevokeGrant(
  tenantId: string
): UseMutationResult<SupportGrant, Error, RevokeGrantInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ grantId, payload }: RevokeGrantInput) =>
      revokeGrant(tenantId, grantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.grants(tenantId),
      })
    },
  })
}
