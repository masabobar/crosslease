import { useQuery } from "@tanstack/react-query"
import {
  fetchSeedPackages,
  SEED_PACKAGES_QUERY_KEYS,
} from "@/features/tenants/api/tenantsApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useSeedPackages() {
  return useQuery({
    queryKey: SEED_PACKAGES_QUERY_KEYS.all(),
    queryFn: fetchSeedPackages,
    staleTime: FIVE_MINUTES_MS,
  })
}
