import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteSelfPicture } from "@/features/users/api/usersApi"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"

export function useDeleteSelfPicture(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteSelfPicture(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.me() })
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
