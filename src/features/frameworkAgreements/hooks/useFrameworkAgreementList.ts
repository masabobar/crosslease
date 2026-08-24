import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAListResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreements,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FrameworkAgreementListParams } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

const MIN_SEARCH_LENGTH = 3

export function useFrameworkAgreementList(
  params: FrameworkAgreementListParams
): UseQueryResult<FAListResponse, Error> {
  // Below three characters the term is dropped rather than sent: the backend matches
  // agreement_name with an unanchored ILIKE, so one or two characters match most of the
  // book and cost a request to say nothing. A dropped term is indistinguishable from an
  // empty one by design — the list stays unfiltered until the search is worth running.
  const normalizedParams: FrameworkAgreementListParams = {
    ...params,
    search:
      params.search && params.search.length >= MIN_SEARCH_LENGTH
        ? params.search
        : undefined,
  }

  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchFrameworkAgreements(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
