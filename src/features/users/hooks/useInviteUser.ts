import { useMutation, useQueryClient } from "@tanstack/react-query"
import { inviteUser, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
    },
  })
}
