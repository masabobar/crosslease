import { useQuery } from "@tanstack/react-query"
import {
  fetchCurrentUser,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"

export function useCurrentUser() {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.me(),
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
