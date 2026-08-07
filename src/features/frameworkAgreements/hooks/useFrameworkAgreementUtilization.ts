import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAUtilizationResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementUtilization,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementUtilization(
  id: string
): UseQueryResult<FAUtilizationResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.utilization(id),
    queryFn: () => fetchFrameworkAgreementUtilization(id),
    enabled: !!id,
  })
}
