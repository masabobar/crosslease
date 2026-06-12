import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  suspendUser,
  reactivateUser,
  deactivateUser,
  resendInvitation,
  resetUserMfa,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import type {
  SuspendUserInput,
  ReactivateUserInput,
  DeactivateUserInput,
  ResendInvitationInput,
} from "@/features/users/api/schema"

function createUserActionMutation<TInput>(
  mutationFn: (userId: string, input: TInput) => Promise<unknown>,
  invalidateDetail = true
) {
  return function () {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ userId, input }: { userId: string; input: TInput }) =>
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

export const useSuspendUser =
  createUserActionMutation<SuspendUserInput>(suspendUser)
export const useReactivateUser =
  createUserActionMutation<ReactivateUserInput>(reactivateUser)
export const useDeactivateUser =
  createUserActionMutation<DeactivateUserInput>(deactivateUser)
export const useResendInvitation =
  createUserActionMutation<ResendInvitationInput>(resendInvitation, false)

export function useResetUserMfa() {
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
