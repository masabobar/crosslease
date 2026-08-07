import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAVersionDetailResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementVersionDetail,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementVersionDetail(
  id: string,
  versionNumber: string | null
): UseQueryResult<FAVersionDetailResponse, Error> {
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
