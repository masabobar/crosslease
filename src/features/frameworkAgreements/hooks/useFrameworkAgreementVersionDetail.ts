import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementVersionDetail,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementVersionDetail(
  id: string,
  versionNumber: string | null
) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.versionDetail(
      id,
      versionNumber ?? ""
    ),
    queryFn: () =>
      fetchFrameworkAgreementVersionDetail(id, versionNumber ?? ""),
    enabled: !!id && !!versionNumber,
  })
}
