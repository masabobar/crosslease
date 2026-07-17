import { useQuery } from "@tanstack/react-query"
import {
  fetchLcPortalFrameworkAgreements,
  LC_PORTAL_QUERY_KEYS,
} from "@/features/lc/api/lcPortalApi"

export function useLcPortalFrameworkAgreements() {
  return useQuery({
    queryKey: LC_PORTAL_QUERY_KEYS.frameworkAgreements(),
    queryFn: fetchLcPortalFrameworkAgreements,
  })
}
