import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { uploadSelfPicture } from "@/features/users/api/usersApi"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UserResponse } from "@/features/users/api/schema"

export function useUploadSelfPicture(
  userId: string
): UseMutationResult<UserResponse, Error, File> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadSelfPicture(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.me() })
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(userId),
      })
    },
  })
}
