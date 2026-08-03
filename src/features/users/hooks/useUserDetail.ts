import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import { fetchUserById, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UserDetail } from "@/features/users/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useUserDetail(
  userId: string | null
): UseQueryResult<UserDetail, Error> {
  return useQuery<UserDetail>({
    queryKey: USERS_QUERY_KEYS.detail(userId ?? ""),
    queryFn: () => fetchUserById(userId!),
    staleTime: THIRTY_SECONDS_MS,
    enabled: !!userId,
  })
}
