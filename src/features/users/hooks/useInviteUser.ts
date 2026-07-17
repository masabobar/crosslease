import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { inviteUser, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type {
  InviteUserInput,
  InviteUserResponse,
} from "@/features/users/api/schema"

export function useInviteUser(): UseMutationResult<
  InviteUserResponse,
  Error,
  InviteUserInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
    },
  })
}
