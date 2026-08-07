import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { SeedPackagesResponse } from "@/features/tenants/api/schema"
import {
  fetchSeedPackages,
  SEED_PACKAGES_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useSeedPackages(): UseQueryResult<SeedPackagesResponse, Error> {
  return useQuery({
    queryKey: SEED_PACKAGES_QUERY_KEYS.all(),
    queryFn: fetchSeedPackages,
    staleTime: FIVE_MINUTES_MS,
  })
}
