import { useQuery } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseDataMeta,
} from "@/features/cases/api/casesApi"
import type { CaseDataMeta } from "@/features/cases/api/schema"

/**
 * The workspace header's contract count.
 *
 * Kept as its own query rather than folded into `useCase`: the case object and the case data
 * aggregate are separate endpoints, and the header must render as soon as the case arrives instead
 * of waiting on the heavier aggregate.
 */
export function useCaseDataMeta(caseId: string | undefined) {
  return useQuery<CaseDataMeta>({
    queryKey: CASE_QUERY_KEYS.dataMeta(caseId ?? ""),
    queryFn: () => fetchCaseDataMeta(caseId as string),
    enabled: Boolean(caseId),
  })
}
