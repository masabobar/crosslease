import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementDocuments,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementDocuments(id: string) {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.documents(id),
    queryFn: () => fetchFrameworkAgreementDocuments(id),
    enabled: !!id,
  })
}
