import { useQuery } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseLeasingCompany,
} from "@/features/cases/api/casesApi"
import type { CaseLeasingCompanyResponse } from "@/features/cases/api/schema"

/**
 * The leasing company bound to a case, with its framework agreement read back.
 *
 * `null` is a real, expected value — every case is unbound between `POST /cases` and the first
 * bind, and the endpoint answers `null` rather than 404 for it. So this is not treated as an error
 * state and needs no `retry: false`: an actual failure here is a failure worth retrying.
 */
export function useCaseLeasingCompany(caseId: string | undefined) {
  return useQuery<CaseLeasingCompanyResponse | null>({
    queryKey: CASE_QUERY_KEYS.leasingCompany(caseId ?? ""),
    queryFn: () => fetchCaseLeasingCompany(caseId as string),
    enabled: Boolean(caseId),
  })
}
