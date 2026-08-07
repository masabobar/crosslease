import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { inviteUser } from "@/features/users/api/usersApi"
import { invalidateGovernedUserQueries } from "@/features/users/hooks/invalidateGovernedUserQueries"
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
      invalidateGovernedUserQueries(queryClient)
    },
  })
}
