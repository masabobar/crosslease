import { useQuery } from "@tanstack/react-query"
import {
  fetchLcPortalFrameworkAgreements,
  LC_PORTAL_QUERY_KEYS,
} from "@/features/lc/api/lcPortalApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useLcPortalFrameworkAgreements() {
  return useQuery({
    queryKey: LC_PORTAL_QUERY_KEYS.frameworkAgreements(),
    queryFn: fetchLcPortalFrameworkAgreements,
    staleTime: THIRTY_SECONDS_MS,
  })
}
