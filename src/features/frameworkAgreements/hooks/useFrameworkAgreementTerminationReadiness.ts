import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementTerminationReadiness,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementTerminationReadiness(
  id: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.terminationReadiness(id),
    queryFn: () => fetchFrameworkAgreementTerminationReadiness(id),
    enabled: enabled && !!id,
  })
}
