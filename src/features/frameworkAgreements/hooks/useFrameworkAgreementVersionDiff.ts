import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FAVersionDiffResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementVersionDiff,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementVersionDiff(
  id: string,
  fromVersion: string,
  toVersion: string,
  enabled: boolean
): UseQueryResult<FAVersionDiffResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.versionDiff(
      id,
      fromVersion,
      toVersion
    ),
    queryFn: () =>
      fetchFrameworkAgreementVersionDiff(id, fromVersion, toVersion),
    enabled: enabled && !!id && !!fromVersion && !!toVersion,
  })
}
