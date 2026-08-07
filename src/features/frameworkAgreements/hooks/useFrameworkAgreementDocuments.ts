import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FADocumentListResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementDocuments,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementDocuments(
  id: string
): UseQueryResult<FADocumentListResponse, Error> {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.documents(id),
    queryFn: () => fetchFrameworkAgreementDocuments(id),
    enabled: !!id,
  })
}
