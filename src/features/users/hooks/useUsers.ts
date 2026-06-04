import { useQuery } from "@tanstack/react-query"
import { fetchUsers, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UsersQueryParams } from "@/features/users/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useUsers(params: UsersQueryParams = {}) {
  const normalizedParams: UsersQueryParams = {
    ...params,
    search:
      params.search && params.search.length >= 3 ? params.search : undefined,
  }

  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchUsers(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
