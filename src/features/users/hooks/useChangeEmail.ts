import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { changeUserEmail } from "@/features/users/api/usersApi"
import { invalidateGovernedUserQueries } from "@/features/users/hooks/invalidateGovernedUserQueries"
import type { ChangeEmailInput } from "@/features/users/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"

export function useChangeEmail(): UseMutationResult<
  GovernedAction,
  Error,
  { userId: string; input: ChangeEmailInput }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: ChangeEmailInput
    }) => changeUserEmail(userId, input),
    onSuccess: (_data, variables) => {
      invalidateGovernedUserQueries(queryClient, variables.userId)
    },
  })
}
