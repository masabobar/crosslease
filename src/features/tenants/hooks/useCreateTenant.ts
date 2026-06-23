import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createTenant,
  TENANTS_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TENANTS_QUERY_KEYS.list(),
      })
    },
  })
}
