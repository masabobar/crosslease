import { useQuery } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseContracts,
} from "@/features/cases/api/casesApi"
import type { CaseContractListResponse } from "@/features/cases/api/schema"

/**
 * The lease contracts in a case's refinancing request.
 *
 * Disabled until a case id is known so a non-UUID route param never fires a request the backend
 * would reject, matching `useCase`, `useCaseProgress` and `useFinancingOverview`.
 *
 * Unlike `useFinancingOverview` this does NOT set `retry: false`: a case always has a contract set
 * (possibly empty), so there is no ordinary-404 state to short-circuit — a failure here is a real
 * failure and the default retry is appropriate.
 */
export function useCaseContracts(caseId: string | undefined) {
  return useQuery<CaseContractListResponse>({
    queryKey: CASE_QUERY_KEYS.contracts(caseId ?? ""),
    queryFn: () => fetchCaseContracts(caseId as string),
    enabled: Boolean(caseId),
  })
}
