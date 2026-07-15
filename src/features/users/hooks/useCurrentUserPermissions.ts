import { useQuery } from "@tanstack/react-query"
import {
  fetchCurrentUserPermissions,
  USERS_QUERY_KEYS,
} from "@/features/users/api/usersApi"
import { useAuthStore } from "@/store/authStore"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useCurrentUserPermissions() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return useQuery({
    queryKey: USERS_QUERY_KEYS.mePermissions(),
    queryFn: fetchCurrentUserPermissions,
    staleTime: FIVE_MINUTES_MS,
    retry: false,
    enabled: isAuthenticated,
  })
}
