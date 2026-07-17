import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { approveUser, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UserActionResponse } from "@/features/users/api/schema"

export function useApproveUser(): UseMutationResult<
  UserActionResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: (_result, userId) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
