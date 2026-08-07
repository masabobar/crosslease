import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FADetailResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementDetail,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementDetail(
  id: string
): UseQueryResult<FADetailResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(id),
    queryFn: () => fetchFrameworkAgreementDetail(id),
    enabled: !!id,
  })
}
