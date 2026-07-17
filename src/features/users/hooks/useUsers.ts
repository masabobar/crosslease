import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import { fetchUsers, USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type {
  PaginatedUsersResponse,
  UsersQueryParams,
} from "@/features/users/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

const MIN_SEARCH_LENGTH = 3

export function useUsers(
  params: UsersQueryParams = {}
): UseQueryResult<PaginatedUsersResponse, Error> {
  const normalizedParams: UsersQueryParams = {
    ...params,
    search:
      params.search && params.search.length >= MIN_SEARCH_LENGTH
        ? params.search
        : undefined,
  }

  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchUsers(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
