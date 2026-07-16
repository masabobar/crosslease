import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementLcPartners,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementLcPartners() {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.lcPartners(),
    queryFn: fetchFrameworkAgreementLcPartners,
  })
}
