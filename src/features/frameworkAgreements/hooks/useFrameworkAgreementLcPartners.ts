import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FALCPartnersResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementLcPartners,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementLcPartners(): UseQueryResult<
  FALCPartnersResponse,
  Error
> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.lcPartners(),
    queryFn: fetchFrameworkAgreementLcPartners,
  })
}
