import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementDetail,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementDetail(id: string) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(id),
    queryFn: () => fetchFrameworkAgreementDetail(id),
    enabled: !!id,
  })
}
