import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementReconstruct,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementReconstruct(
  id: string,
  asOf: string | null
) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.reconstruct(id, asOf ?? ""),
    queryFn: () => fetchFrameworkAgreementReconstruct(id, asOf as string),
    enabled: !!id && !!asOf,
  })
}
