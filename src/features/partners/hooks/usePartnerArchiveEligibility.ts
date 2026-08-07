import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ArchiveEligibilityResponse } from "@/features/partners/api/schema"
import {
  fetchArchiveEligibility,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

// `isEnabled` lets the archive dialog defer the request until it is opened.
export function usePartnerArchiveEligibility(
  partnerId: string,
  isEnabled: boolean
): UseQueryResult<ArchiveEligibilityResponse, Error> {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.archiveEligibility(partnerId),
    queryFn: () => fetchArchiveEligibility(partnerId),
    enabled: isEnabled,
  })
}
