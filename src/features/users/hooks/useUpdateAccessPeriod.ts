import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  updateUserAccessPeriod,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import type { UpdateAccessPeriodInput } from "@/features/users/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"

export function useUpdateAccessPeriod(): UseMutationResult<
  GovernedAction,
  Error,
  { userId: string; input: UpdateAccessPeriodInput }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: UpdateAccessPeriodInput
    }) => updateUserAccessPeriod(userId, input),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
