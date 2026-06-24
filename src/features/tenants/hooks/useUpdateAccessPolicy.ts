import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateAccessPolicy,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { UpdateAccessPolicyPayload } from "@/features/tenants/api/tenantsApi"

export function useUpdateAccessPolicy(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAccessPolicyPayload) =>
      updateAccessPolicy(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.accessPolicy(tenantId),
      })
    },
  })
}
