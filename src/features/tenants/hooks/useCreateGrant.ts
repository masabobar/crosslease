import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { SupportGrant } from "@/features/tenants/api/schema"
import {
  createGrant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import type { CreateGrantPayload } from "@/features/tenants/api/tenantsApi"

export function useCreateGrant(
  tenantId: string
): UseMutationResult<SupportGrant, Error, CreateGrantPayload> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGrantPayload) => createGrant(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.grants(tenantId),
      })
    },
  })
}
