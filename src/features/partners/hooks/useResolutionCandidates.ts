import { useQuery } from "@tanstack/react-query"
import {
  fetchResolutionCandidates,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function useResolutionCandidates(partnerId: string) {
  return useQuery({
    queryKey: PARTNERS_QUERY_KEYS.resolutionCandidates(partnerId),
    queryFn: () => fetchResolutionCandidates(partnerId),
  })
}
