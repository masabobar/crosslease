import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAListResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreements,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FrameworkAgreementListParams } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useFrameworkAgreementList(
  params: FrameworkAgreementListParams
): UseQueryResult<FAListResponse, Error> {
  const normalizedParams: FrameworkAgreementListParams = {
    ...params,
    q: params.q && params.q.length >= 3 ? params.q : undefined,
  }

  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchFrameworkAgreements(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
