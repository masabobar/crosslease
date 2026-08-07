import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CatalogListResponse } from "@/features/workflowTaskCatalog/api/schema"
import {
  fetchWorkflowTaskCatalogs,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type { WorkflowTaskCatalogListParams } from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import { MIN_SEARCH_LENGTH } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogListParams"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useWorkflowTaskCatalogList(
  params: WorkflowTaskCatalogListParams
): UseQueryResult<CatalogListResponse, Error> {
  const normalizedParams: WorkflowTaskCatalogListParams = {
    ...params,
    search:
      params.search && params.search.length >= MIN_SEARCH_LENGTH
        ? params.search
        : undefined,
  }

  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchWorkflowTaskCatalogs(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
