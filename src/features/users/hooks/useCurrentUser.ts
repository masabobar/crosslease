import { useQuery } from "@tanstack/react-query"
import {
  fetchCurrentUser,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import { useAuthStore } from "@/store/authStore"

export function useCurrentUser() {
  const accessToken = useAuthStore(s => s.accessToken)

  return useQuery({
    queryKey: USERS_QUERY_KEYS.me(),
    queryFn: fetchCurrentUser,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
