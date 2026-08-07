import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PlatformModulesResponse } from "@/features/tenants/api/schema"
import {
  fetchPlatformModules,
  PLATFORM_MODULES_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function usePlatformModules(): UseQueryResult<
  PlatformModulesResponse,
  Error
> {
  return useQuery({
    queryKey: PLATFORM_MODULES_QUERY_KEYS.all(),
    queryFn: fetchPlatformModules,
    staleTime: FIVE_MINUTES_MS,
  })
}
