import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  suspendUser,
  reactivateUser,
  deactivateUser,
  resendInvitation,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import type {
  SuspendUserInput,
  ReactivateUserInput,
  DeactivateUserInput,
  ResendInvitationInput,
} from "@/features/users/api/schema"

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: SuspendUserInput
    }) => suspendUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(variables.userId),
      })
    },
  })
}

export function useReactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: ReactivateUserInput
    }) => reactivateUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(variables.userId),
      })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: DeactivateUserInput
    }) => deactivateUser(userId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(variables.userId),
      })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: ResendInvitationInput
    }) => resendInvitation(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
    },
  })
}
