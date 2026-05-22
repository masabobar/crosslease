import { useQuery } from "@tanstack/react-query"
import { fetchUsers, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type { UsersQueryParams } from "@/features/users/api/schema"

export function useUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: prev => prev,
  })
}
