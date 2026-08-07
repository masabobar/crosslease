import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FALinkedFinancingsResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementFinancings,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementFinancings(
  id: string
): UseQueryResult<FALinkedFinancingsResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.financings(id),
    queryFn: () => fetchFrameworkAgreementFinancings(id),
    enabled: !!id,
  })
}
