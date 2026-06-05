import { useMutation, useQueryClient } from "@tanstack/react-query"
import { changeUserRole } from "@/features/users/api/usersApi"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { ChangeRoleInput } from "@/features/users/api/schema"

export function useChangeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: ChangeRoleInput
    }) => changeUserRole(userId, input),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
