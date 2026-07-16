import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementUtilization,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementUtilization(id: string) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.utilization(id),
    queryFn: () => fetchFrameworkAgreementUtilization(id),
    enabled: !!id,
  })
}
