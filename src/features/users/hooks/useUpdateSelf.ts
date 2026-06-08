import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateSelf } from "@/features/users/api/usersApi"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UpdateSelfInput } from "@/features/users/api/schema"

export function useUpdateSelf(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSelfInput) => updateSelf(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.me() })
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
