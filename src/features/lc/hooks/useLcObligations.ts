import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { LCObligationResponse } from "@/features/lc/api/schema"
import {
  fetchLcObligations,
  LC_PORTAL_QUERY_KEYS,
} from "@/features/lc/api/lcPortalApi"

// D-12 (PRD1042-1796 item 9). Keyed by the case alone — the catalogue is resolved server-side from
// the company's own bank, so it is never part of the key or the request.
export function useLcObligations(
  businessObjectId: string | undefined
): UseQueryResult<LCObligationResponse, Error> {
  return useQuery({
    queryKey: LC_PORTAL_QUERY_KEYS.obligations(businessObjectId ?? ""),
    queryFn: () => fetchLcObligations(businessObjectId as string),
    enabled: Boolean(businessObjectId),
  })
}
