import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  suspendUser,
  reactivateUser,
  deactivateUser,
  resendInvitation,
  resetUserMfa,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import type {
  UserActionResponse,
  SuspendUserInput,
  ReactivateUserInput,
  DeactivateUserInput,
  ResendInvitationInput,
} from "@/features/users/api/schema"

type UserActionVariables<TInput> = { userId: string; input: TInput }

// Generic over the response too, so callers keep the `UserActionResponse` the api layer
// already parsed instead of an erased `unknown`.
function createUserActionMutation<TInput, TResponse>(
  mutationFn: (userId: string, input: TInput) => Promise<TResponse>,
  invalidateDetail = true
) {
  return function (): UseMutationResult<
    TResponse,
    Error,
    UserActionVariables<TInput>
  > {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId, input }: UserActionVariables<TInput>) =>
        mutationFn(userId, input),
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
        if (invalidateDetail) {
          queryClient.invalidateQueries({
            queryKey: USERS_QUERY_KEYS.detail(variables.userId),
          })
        }
      },
    })
  }
}

export const useSuspendUser = createUserActionMutation<
  SuspendUserInput,
  UserActionResponse
>(suspendUser)
export const useReactivateUser = createUserActionMutation<
  ReactivateUserInput,
  UserActionResponse
>(reactivateUser)
export const useDeactivateUser = createUserActionMutation<
  DeactivateUserInput,
  UserActionResponse
>(deactivateUser)
export const useResendInvitation = createUserActionMutation<
  ResendInvitationInput,
  UserActionResponse
>(resendInvitation, false)

export function useResetUserMfa(): UseMutationResult<
  UserActionResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => resetUserMfa(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
