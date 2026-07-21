import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  changeUserEmail,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import type { ChangeEmailInput } from "@/features/users/api/schema"
import type { GovernedAction } from "@/features/governed-actions/api/schema"

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
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(variables.userId),
      })
    },
  })
}
