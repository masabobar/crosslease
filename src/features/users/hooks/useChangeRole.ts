import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { changeUserRole } from "@/features/users/api/usersApi"
import { invalidateGovernedUserQueries } from "@/features/users/hooks/invalidateGovernedUserQueries"
import type { ChangeRoleInput } from "@/features/users/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"

export function useChangeRole(): UseMutationResult<
  GovernedAction,
  Error,
  { userId: string; input: ChangeRoleInput }
> {
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
      invalidateGovernedUserQueries(queryClient, userId)
    },
  })
}
