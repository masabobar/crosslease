import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TerminationReadinessResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementTerminationReadiness,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementTerminationReadiness(
  id: string,
  enabled: boolean
): UseQueryResult<TerminationReadinessResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.terminationReadiness(id),
    queryFn: () => fetchFrameworkAgreementTerminationReadiness(id),
    enabled: enabled && !!id,
  })
}
