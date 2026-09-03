import { useQuery } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchCaseProgress,
} from "@/features/cases/api/casesApi"
import type { CaseProgressResponse } from "@/features/cases/api/schema"

/**
 * The case's phase progress — what the workspace's progress band renders.
 *
 * Disabled until a case id is known so a non-UUID route param never fires a request the backend
 * would reject, matching `useCase`.
 */
export function useCaseProgress(caseId: string | undefined) {
  return useQuery<CaseProgressResponse>({
    queryKey: CASE_QUERY_KEYS.progress(caseId ?? ""),
    queryFn: () => fetchCaseProgress(caseId as string),
    enabled: Boolean(caseId),
  })
}
