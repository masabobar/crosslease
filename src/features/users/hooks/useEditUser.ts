import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { editUser, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type {
  EditUserInput,
  UserDetail,
  UserResponse,
} from "@/features/users/api/schema"

export function useEditUser(): UseMutationResult<
  UserDetail,
  Error,
  { userId: string; input: EditUserInput }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: EditUserInput }) =>
      editUser(userId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(variables.userId),
      })
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.lists(),
      })
      const me = queryClient.getQueryData<UserResponse>(USERS_QUERY_KEYS.me())
      if (me?.id === variables.userId) {
        void queryClient.invalidateQueries({
          queryKey: USERS_QUERY_KEYS.me(),
        })
      }
    },
  })
}
