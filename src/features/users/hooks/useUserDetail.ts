import { useQuery } from "@tanstack/react-query"
import { fetchUserById, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UserDetail } from "@/features/users/api/schema"

export function useUserDetail(userId: string | null) {
  return useQuery<UserDetail>({
    queryKey: USERS_QUERY_KEYS.detail(userId ?? ""),
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
  })
}
