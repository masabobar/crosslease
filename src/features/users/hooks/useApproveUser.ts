import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approveUser, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"

export function useApproveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
    },
  })
}
