import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAVersionListResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementVersions,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementVersions(
  id: string
): UseQueryResult<FAVersionListResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.versions(id),
    queryFn: () => fetchFrameworkAgreementVersions(id),
    enabled: !!id,
  })
}
