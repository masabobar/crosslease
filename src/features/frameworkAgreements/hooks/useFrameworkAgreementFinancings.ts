import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementFinancings,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementFinancings(id: string) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.financings(id),
    queryFn: () => fetchFrameworkAgreementFinancings(id),
    enabled: !!id,
  })
}
