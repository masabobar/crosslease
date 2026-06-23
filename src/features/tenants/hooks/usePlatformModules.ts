import { useQuery } from "@tanstack/react-query"
import {
  fetchPlatformModules,
  PLATFORM_MODULES_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function usePlatformModules() {
  return useQuery({
    queryKey: PLATFORM_MODULES_QUERY_KEYS.all(),
    queryFn: fetchPlatformModules,
    staleTime: FIVE_MINUTES_MS,
  })
}
