import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementVersions,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementVersions(id: string) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.versions(id),
    queryFn: () => fetchFrameworkAgreementVersions(id),
    enabled: !!id,
  })
}
