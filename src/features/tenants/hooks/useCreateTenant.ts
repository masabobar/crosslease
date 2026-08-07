import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CreateTenantForm } from "@/features/tenants/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import {
  createTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useCreateTenant(): UseMutationResult<
  GovernedAction,
  Error,
  CreateTenantForm
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.lists(),
      })
    },
  })
}
