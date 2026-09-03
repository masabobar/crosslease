import { useQuery } from "@tanstack/react-query"
import {
  FINANCING_QUERY_KEYS,
  fetchFinancingOverview,
} from "@/features/financing/api/financingApi"
import type { FinancingOverviewResponse } from "@/features/financing/api/schema"

/**
 * The financing behind a case — what the workspace's Data tab renders.
 *
 * Disabled until a case id is known so a non-UUID route param never fires a request the backend
 * would reject, matching `useCase` and `useCaseProgress`.
 *
 * A case that has not reached an approved decision has no financing yet, so a 404 here is an
 * ordinary state rather than a failure. `retry: false` keeps that from being retried three times
 * before the empty state appears.
 */
export function useFinancingOverview(caseId: string | undefined) {
  return useQuery<FinancingOverviewResponse>({
    queryKey: FINANCING_QUERY_KEYS.overview(caseId ?? ""),
    queryFn: () => fetchFinancingOverview(caseId as string),
    enabled: Boolean(caseId),
    retry: false,
  })
}
