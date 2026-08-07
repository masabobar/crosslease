import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CatalogDetailResponse } from "@/features/workflowTaskCatalog/api/schema"
import {
  fetchWorkflowTaskCatalogDetail,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useWorkflowTaskCatalogDetail(
  catalogId: string | undefined
): UseQueryResult<CatalogDetailResponse, Error> {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.detail(catalogId ?? ""),
    queryFn: () => fetchWorkflowTaskCatalogDetail(catalogId as string),
    enabled: !!catalogId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
