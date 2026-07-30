import { useInfiniteQuery } from "@tanstack/react-query"
import {
  fetchWorkflowTaskCatalogAuditTrail,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// The endpoint caps per_page at 50 server-side; asking for more is rejected.
export const AUDIT_TRAIL_PAGE_SIZE = 25

// Cursor-paginated, not offset — mirrors usePartnerDecisionHistory rather than the catalogue
// list's paging.
export function useWorkflowTaskCatalogAuditTrail(
  catalogId: string | undefined
) {
  return useInfiniteQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.auditTrail(catalogId ?? ""),
    queryFn: ({ pageParam }) =>
      fetchWorkflowTaskCatalogAuditTrail(catalogId as string, {
        per_page: AUDIT_TRAIL_PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!catalogId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
