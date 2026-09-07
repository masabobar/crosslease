import { useQuery } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseProductTemplate,
} from "@/features/cases/api/casesApi"
import type { CaseProductTemplateResponse } from "@/features/cases/api/schema"

// The bank product template bound to a case (wizard step 1, US 1.3). `null` until it is chosen,
// for the same reason as the leasing company.
export function useCaseProductTemplate(caseId: string | undefined) {
  return useQuery<CaseProductTemplateResponse | null>({
    queryKey: CASE_QUERY_KEYS.productTemplate(caseId ?? ""),
    queryFn: () => fetchCaseProductTemplate(caseId as string),
    enabled: Boolean(caseId),
  })
}
